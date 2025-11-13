<?php
/**
 * Plugin Name: RankYak Integration
 * Plugin URI: https://rankyak.com
 * Description: Connect your WordPress site with RankYak to automatically publish SEO-optimized articles.
 * Version: 1.0.0
 * Author: RankYak
 * Author URI: https://rankyak.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: rankyak-integration
 * Domain Path: /languages
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('RANKYAK_VERSION', '1.0.0');
define('RANKYAK_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('RANKYAK_PLUGIN_URL', plugin_dir_url(__FILE__));
define('RANKYAK_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Include required files
require_once RANKYAK_PLUGIN_DIR . 'includes/class-rankyak-api.php';
require_once RANKYAK_PLUGIN_DIR . 'includes/class-rankyak-webhook.php';
require_once RANKYAK_PLUGIN_DIR . 'admin/class-rankyak-admin.php';

/**
 * Main plugin class
 */
class RankYak_Integration {
    
    private static $instance = null;
    
    public static function get_instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->init();
    }
    
    private function init() {
        // Initialize admin
        if (is_admin()) {
            new RankYak_Admin();
        }
        
        // Initialize webhook handler
        new RankYak_Webhook();
        
        // Register activation/deactivation hooks
        register_activation_hook(__FILE__, array($this, 'activate'));
        register_deactivation_hook(__FILE__, array($this, 'deactivate'));
        
        // Add REST API endpoints
        add_action('rest_api_init', array($this, 'register_rest_routes'));
    }
    
    /**
     * Plugin activation
     */
    public function activate() {
        // Create necessary database tables or options
        add_option('rankyak_version', RANKYAK_VERSION);
        
        // Flush rewrite rules
        flush_rewrite_rules();
    }
    
    /**
     * Plugin deactivation
     */
    public function deactivate() {
        // Clean up if needed
        flush_rewrite_rules();
    }
    
    /**
     * Register REST API routes
     */
    public function register_rest_routes() {
        register_rest_route('rankyak/v1', '/publish', array(
            'methods' => 'POST',
            'callback' => array($this, 'handle_publish'),
            'permission_callback' => array($this, 'verify_api_request'),
        ));
        
        register_rest_route('rankyak/v1', '/test', array(
            'methods' => 'GET',
            'callback' => array($this, 'handle_test'),
            'permission_callback' => array($this, 'verify_api_request'),
        ));
    }
    
    /**
     * Verify API request using integration key
     */
    public function verify_api_request($request) {
        $integration_key_header = $request->get_header('X-Integration-Key');
        
        if (!$integration_key_header) {
            return new WP_Error('missing_auth', 'Integration key is required in X-Integration-Key header', array('status' => 401));
        }
        
        $api = new RankYak_API();
        $is_valid = $api->verify_integration_key($integration_key_header);
        
        if (!$is_valid) {
            return new WP_Error('invalid_key', 'Invalid or inactive integration key', array('status' => 401));
        }
        
        return true;
    }
    
    /**
     * Handle publish request
     */
    public function handle_publish($request) {
        $params = $request->get_json_params();
        
        if (!isset($params['title']) || !isset($params['content'])) {
            return new WP_Error('missing_params', 'Title and content are required', array('status' => 400));
        }
        
        $post_data = array(
            'post_title' => sanitize_text_field($params['title']),
            'post_content' => wp_kses_post($params['content']),
            'post_status' => isset($params['status']) ? sanitize_text_field($params['status']) : 'draft',
            'post_type' => 'post',
        );
        
        if (isset($params['excerpt'])) {
            $post_data['post_excerpt'] = sanitize_textarea_field($params['excerpt']);
        }
        
        if (isset($params['meta_title'])) {
            $post_data['meta_title'] = sanitize_text_field($params['meta_title']);
        }
        
        if (isset($params['meta_description'])) {
            $post_data['meta_description'] = sanitize_textarea_field($params['meta_description']);
        }
        
        $post_id = wp_insert_post($post_data);
        
        if (is_wp_error($post_id)) {
            return $post_id;
        }
        
        // Set meta fields
        if (isset($params['meta_title'])) {
            update_post_meta($post_id, '_yoast_wpseo_title', $params['meta_title']);
        }
        
        if (isset($params['meta_description'])) {
            update_post_meta($post_id, '_yoast_wpseo_metadesc', $params['meta_description']);
        }
        
        // Handle featured image if provided
        if (isset($params['featured_image_url'])) {
            $this->set_featured_image($post_id, $params['featured_image_url']);
        }
        
        $post = get_post($post_id);
        
        return new WP_REST_Response(array(
            'success' => true,
            'post_id' => $post_id,
            'url' => get_permalink($post_id),
            'link' => get_permalink($post_id),
        ), 200);
    }
    
    /**
     * Handle test request
     */
    public function handle_test($request) {
        return new WP_REST_Response(array(
            'success' => true,
            'message' => 'RankYak plugin is active',
            'version' => RANKYAK_VERSION,
            'site_url' => get_site_url(),
        ), 200);
    }
    
    /**
     * Set featured image from URL
     */
    private function set_featured_image($post_id, $image_url) {
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        
        $tmp = download_url($image_url);
        
        if (is_wp_error($tmp)) {
            return false;
        }
        
        $file_array = array(
            'name' => basename($image_url),
            'tmp_name' => $tmp,
        );
        
        $id = media_handle_sideload($file_array, $post_id);
        
        if (is_wp_error($id)) {
            @unlink($file_array['tmp_name']);
            return false;
        }
        
        set_post_thumbnail($post_id, $id);
        return true;
    }
}

// Initialize plugin
function rankyak_integration() {
    return RankYak_Integration::get_instance();
}

// Start the plugin
rankyak_integration();

