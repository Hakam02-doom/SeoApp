<?php
/**
 * RankYak Webhook Handler
 */

if (!defined('ABSPATH')) {
    exit;
}

class RankYak_Webhook {
    
    public function __construct() {
        // Send webhook when post is published
        add_action('transition_post_status', array($this, 'on_post_status_change'), 10, 3);
        
        // Send webhook when post is updated
        add_action('save_post', array($this, 'on_post_save'), 10, 3);
        
        // Send webhook when post is deleted
        add_action('before_delete_post', array($this, 'on_post_delete'), 10, 1);
    }
    
    /**
     * Handle post status change
     */
    public function on_post_status_change($new_status, $old_status, $post) {
        if ($new_status === $old_status) {
            return;
        }
        
        // Only send webhook for published posts
        if ($new_status === 'publish') {
            $this->send_post_webhook('post.published', $post);
        } elseif ($old_status === 'publish' && $new_status !== 'publish') {
            $this->send_post_webhook('post.unpublished', $post);
        }
    }
    
    /**
     * Handle post save
     */
    public function on_post_save($post_id, $post, $update) {
        // Skip autosaves and revisions
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }
        
        if (wp_is_post_revision($post_id)) {
            return;
        }
        
        // Only send webhook for published posts
        if ($post->post_status === 'publish' && $update) {
            $this->send_post_webhook('post.updated', $post);
        }
    }
    
    /**
     * Handle post delete
     */
    public function on_post_delete($post_id) {
        $post = get_post($post_id);
        
        if ($post && $post->post_status === 'publish') {
            $this->send_post_webhook('post.deleted', $post);
        }
    }
    
    /**
     * Send post webhook to RankYak
     */
    private function send_post_webhook($event, $post) {
        $api = new RankYak_API();
        
        $data = array(
            'post_id' => $post->ID,
            'title' => $post->post_title,
            'url' => get_permalink($post->ID),
            'status' => $post->post_status,
            'published_at' => $post->post_date,
            'modified_at' => $post->post_modified,
        );
        
        $api->send_webhook($event, $data);
    }
}

