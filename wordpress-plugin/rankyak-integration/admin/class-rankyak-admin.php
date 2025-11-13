<?php
/**
 * RankYak Admin Interface
 */

if (!defined('ABSPATH')) {
    exit;
}

class RankYak_Admin {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_admin_menu'));
        add_action('admin_enqueue_scripts', array($this, 'enqueue_admin_assets'));
    }
    
    /**
     * Add admin menu
     */
    public function add_admin_menu() {
        add_menu_page(
            'RankYak Integration',
            'RankYak',
            'manage_options',
            'rankyak-integration',
            array($this, 'render_settings_page'),
            'dashicons-admin-links',
            30
        );
    }
    
    /**
     * Enqueue admin assets
     */
    public function enqueue_admin_assets($hook) {
        if ($hook !== 'toplevel_page_rankyak-integration') {
            return;
        }
        
        wp_enqueue_style('rankyak-admin', RANKYAK_PLUGIN_URL . 'assets/css/admin.css', array(), RANKYAK_VERSION);
        wp_enqueue_script('rankyak-admin', RANKYAK_PLUGIN_URL . 'assets/js/admin.js', array('jquery'), RANKYAK_VERSION, true);
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        $api = new RankYak_API();
        $integration_key = $api->get_integration_key();
        $is_connected = !empty($integration_key);
        
        // Handle integration key connection
        if (isset($_POST['connect']) && check_admin_referer('rankyak_connect')) {
            $input_key = sanitize_text_field($_POST['integration_key']);
            
            if (empty($input_key)) {
                echo '<div class="notice notice-error"><p>Please enter an integration key.</p></div>';
            } else {
                // Verify the key
                $is_valid = $api->verify_integration_key($input_key);
                
                if ($is_valid) {
                    // Key is valid, save it
                    $api->set_integration_key($input_key);
                    $integration_key = $input_key;
                    $is_connected = true;
                    echo '<div class="notice notice-success"><p>Successfully connected to RankYak!</p></div>';
                } else {
                    // Get more details about the error
                    $response = wp_remote_get($api->get_base_url() . '/api/integrations/wordpress/validate-key?key=' . urlencode($input_key), array(
                        'headers' => array(
                            'Content-Type' => 'application/json',
                        ),
                        'timeout' => 10,
                    ));
                    
                    $error_message = 'Invalid integration key. Please check and try again.';
                    if (!is_wp_error($response) && wp_remote_retrieve_response_code($response) !== 200) {
                        $body = json_decode(wp_remote_retrieve_body($response), true);
                        if (isset($body['error'])) {
                            $error_message = $body['error'];
                        }
                    }
                    
                    delete_option('rankyak_integration_key');
                    echo '<div class="notice notice-error"><p>' . esc_html($error_message) . '</p></div>';
                }
            }
        }
        
        // Handle disconnection
        if (isset($_POST['disconnect']) && check_admin_referer('rankyak_disconnect')) {
            delete_option('rankyak_integration_key');
            delete_option('rankyak_webhook_url');
            $is_connected = false;
            $integration_key = '';
            echo '<div class="notice notice-success"><p>Disconnected from RankYak successfully.</p></div>';
        }
        
        // Handle API URL update
        if (isset($_POST['api_url']) && check_admin_referer('rankyak_settings')) {
            $api_url = esc_url_raw($_POST['api_url']);
            update_option('rankyak_api_url', $api_url);
            echo '<div class="notice notice-success"><p>Settings saved.</p></div>';
        }
        
        ?>
        <div class="wrap">
            <h1>RankYak Integration</h1>
            
            <div class="rankyak-settings">
                <?php if ($is_connected): ?>
                    <div class="rankyak-status connected">
                        <h2>Status: Connected</h2>
                        <p>Your WordPress site is connected to RankYak.</p>
                        
                        <?php if ($integration_key): ?>
                            <div class="rankyak-integration-key" style="margin: 15px 0; padding: 10px; background: #f0f0f0; border-radius: 4px;">
                                <strong>Integration Key:</strong><br>
                                <code style="font-size: 12px; word-break: break-all;"><?php echo esc_html($integration_key); ?></code>
                                <button type="button" class="button button-small" onclick="navigator.clipboard.writeText('<?php echo esc_js($integration_key); ?>'); alert('Integration key copied!');" style="margin-left: 10px;">
                                    Copy
                                </button>
                            </div>
                        <?php endif; ?>
                        
                        <form method="post" action="">
                            <?php wp_nonce_field('rankyak_disconnect'); ?>
                            <button type="submit" name="disconnect" class="button button-secondary" onclick="return confirm('Are you sure you want to disconnect?');">
                                Disconnect
                            </button>
                        </form>
                    </div>
                <?php else: ?>
                    <div class="rankyak-status disconnected">
                        <h2>Status: Not Connected</h2>
                        <p>Enter your RankYak integration key to connect your WordPress site.</p>
                        <form method="post" action="" style="margin-top: 15px;">
                            <?php wp_nonce_field('rankyak_connect'); ?>
                            <table class="form-table">
                                <tr>
                                    <th scope="row">
                                        <label for="integration_key">Integration Key</label>
                                    </th>
                                    <td>
                                        <input type="text" id="integration_key" name="integration_key" value="" class="regular-text" placeholder="rk_..." required />
                                        <p class="description">Enter your integration key from RankYak dashboard. You can find it in Settings → Integrations.</p>
                                    </td>
                                </tr>
                            </table>
                            <p class="submit">
                                <button type="submit" name="connect" class="button button-primary">Connect</button>
                            </p>
                        </form>
                    </div>
                <?php endif; ?>
                
                <div class="rankyak-settings-form">
                    <h2>Settings</h2>
                    <form method="post" action="">
                        <?php wp_nonce_field('rankyak_settings'); ?>
                        <table class="form-table">
                            <tr>
                                <th scope="row">
                                    <label for="api_url">RankYak API URL</label>
                                </th>
                                <td>
                                    <input type="url" id="api_url" name="api_url" value="<?php echo esc_attr(get_option('rankyak_api_url', 'https://rankyak.com')); ?>" class="regular-text" />
                                    <p class="description">The base URL of your RankYak installation.</p>
                                </td>
                            </tr>
                        </table>
                        <p class="submit">
                            <button type="submit" class="button button-primary">Save Settings</button>
                        </p>
                    </form>
                </div>
                
                <div class="rankyak-info">
                    <h2>About RankYak Integration</h2>
                    <p>RankYak Integration allows you to:</p>
                    <ul>
                        <li>Automatically publish SEO-optimized articles from RankYak</li>
                        <li>Sync article updates in real-time</li>
                        <li>Receive webhooks when articles are published or updated</li>
                    </ul>
                </div>
            </div>
        </div>
        <?php
    }
}

