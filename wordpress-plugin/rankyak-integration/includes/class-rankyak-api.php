<?php
/**
 * RankYak API Client
 */

if (!defined('ABSPATH')) {
    exit;
}

class RankYak_API {
    
    private $base_url;
    
    public function __construct() {
        $this->base_url = get_option('rankyak_api_url', 'https://rankyak.com');
    }
    
    /**
     * Get API base URL
     */
    public function get_base_url() {
        return $this->base_url;
    }
    
    /**
     * Set integration key
     */
    public function set_integration_key($key) {
        update_option('rankyak_integration_key', $key);
    }
    
    /**
     * Get integration key
     */
    public function get_integration_key() {
        return get_option('rankyak_integration_key');
    }
    
    /**
     * Verify integration key with RankYak API
     */
    public function verify_integration_key($key) {
        $response = wp_remote_get($this->base_url . '/api/integrations/wordpress/validate-key?key=' . urlencode($key), array(
            'headers' => array(
                'Content-Type' => 'application/json',
            ),
            'timeout' => 10,
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $status_code = wp_remote_retrieve_response_code($response);
        return $status_code === 200;
    }
    
    /**
     * Send webhook to RankYak
     */
    public function send_webhook($event, $data) {
        $webhook_url = get_option('rankyak_webhook_url');
        
        if (!$webhook_url) {
            return false;
        }
        
        $payload = array(
            'event' => $event,
            'data' => $data,
            'timestamp' => current_time('mysql'),
            'site_url' => get_site_url(),
        );
        
        $response = wp_remote_post($webhook_url, array(
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-RankYak-Event' => $event,
            ),
            'body' => json_encode($payload),
            'timeout' => 10,
        ));
        
        if (is_wp_error($response)) {
            error_log('RankYak webhook error: ' . $response->get_error_message());
            return false;
        }
        
        return true;
    }
    
}

