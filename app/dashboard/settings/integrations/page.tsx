'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';

export default function IntegrationsSettingsPage() {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showWordPressPlugin, setShowWordPressPlugin] = useState(false);
  const [wordPressUrl, setWordPressUrl] = useState('');
  const [wordPressUsername, setWordPressUsername] = useState('');
  const [wordPressPassword, setWordPressPassword] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        
        // Get first project
        const projectsRes = await apiGet('/api/projects');
        if (projectsRes.data?.projects && projectsRes.data.projects.length > 0) {
          const pid = projectsRes.data.projects[0].id;
          setProjectId(pid);

          // Load integrations
          const integrationsRes = await apiGet(`/api/integrations?projectId=${pid}`);
          setIntegrations(integrationsRes.data?.integrations || []);
        }
      } catch (error) {
        console.error('Failed to load integrations:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const wordPressIntegration = integrations.find((i: any) => i.platform === 'wordpress');
  const isWordPressConnected = wordPressIntegration?.isActive;
  const integrationKey = wordPressIntegration?.integrationKey;
  const [showIntegrationKey, setShowIntegrationKey] = useState(false);

  const handleWordPressPluginConnect = async () => {
    if (!projectId) return;

    setIsConnecting(true);
    try {
      // Generate OAuth URL
      const baseUrl = window.location.origin;
      const redirectUri = `${baseUrl}/api/integrations/wordpress/oauth/callback`;
      const state = Math.random().toString(36).substring(7);
      
      const authUrl = `${baseUrl}/api/integrations/wordpress/oauth/authorize?` +
        `response_type=code&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `state=${state}&` +
        `project_id=${projectId}`;

      // Open OAuth flow in new window
      window.open(authUrl, 'WordPress OAuth', 'width=600,height=700');
      
      // Poll for connection status
      const checkInterval = setInterval(async () => {
        const res = await apiGet(`/api/integrations?projectId=${projectId}`);
        const updated = res.data?.integrations?.find((i: any) => i.platform === 'wordpress');
        if (updated?.isActive) {
          clearInterval(checkInterval);
          setIntegrations(res.data?.integrations || []);
          setIsConnecting(false);
          setShowWordPressPlugin(false);
        }
      }, 2000);

      // Clear interval after 5 minutes
      setTimeout(() => clearInterval(checkInterval), 5 * 60 * 1000);
    } catch (error: any) {
      console.error('Failed to connect WordPress:', error);
      try {
        const toast = await import('@/lib/utils/toast');
        toast.handleAPIError(error);
      } catch (e) {
        console.error('Failed to connect WordPress:', error);
      }
      setIsConnecting(false);
    }
  };

  const handleWordPressRESTConnect = async () => {
    if (!projectId || !wordPressUrl || !wordPressUsername || !wordPressPassword) {
      try {
        const toast = await import('@/lib/utils/toast');
        toast.showWarning('Please fill in all fields');
      } catch (e) {
        console.warn('Please fill in all fields');
      }
      return;
    }

    setIsConnecting(true);
    try {
      // Test connection first
      const testRes = await apiPost('/api/integrations/test', {
        platform: 'wordpress',
        credentials: {
          url: wordPressUrl,
          username: wordPressUsername,
          password: wordPressPassword,
        },
      });

      if (!testRes.data?.connected) {
        try {
          const toast = await import('@/lib/utils/toast');
          toast.showError('Connection test failed. Please check your credentials.');
        } catch (e) {
          console.error('Connection test failed. Please check your credentials.');
        }
        setIsConnecting(false);
        return;
      }

      // Create integration
      const createRes = await apiPost('/api/integrations', {
        projectId,
        platform: 'wordpress',
        credentials: {
          url: wordPressUrl,
          username: wordPressUsername,
          password: wordPressPassword,
        },
        isActive: true,
      }, {
        showSuccessToast: true,
        successMessage: 'WordPress integration connected successfully!',
      });

      if (createRes.error) {
        // Error toast is shown automatically by apiPost
        setIsConnecting(false);
        return;
      }

      // Reload integrations
      const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
      setIntegrations(integrationsRes.data?.integrations || []);
      
      // Reset form
      setWordPressUrl('');
      setWordPressUsername('');
      setWordPressPassword('');
      setShowWordPressPlugin(false);
    } catch (error: any) {
      console.error('Failed to connect WordPress:', error);
      try {
        const toast = await import('@/lib/utils/toast');
        toast.handleAPIError(error);
      } catch (e) {
        console.error('Failed to connect WordPress:', error);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      // Use PATCH method for updating
      const res = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: false,
        }),
      }).then(r => r.json());

      if (res.error) {
        alert(res.error || 'Failed to disconnect');
        return;
      }

      // Reload integrations
      const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
      setIntegrations(integrationsRes.data?.integrations || []);
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
      alert(error.message || 'Failed to disconnect');
    }
  };

  const handleDownloadPlugin = () => {
    // Download plugin zip
    window.location.href = '/api/integrations/wordpress/plugin/download';
  };

  const [wordPressSiteUrl, setWordPressSiteUrl] = useState('');

  // Load WordPress URL from existing integration
  useEffect(() => {
    if (wordPressIntegration?.credentials) {
      const credentials = wordPressIntegration.credentials as any;
      if (credentials.url && !wordPressSiteUrl) {
        setWordPressSiteUrl(credentials.url);
      }
    }
  }, [wordPressIntegration, wordPressSiteUrl]);

  const handleGenerateIntegrationKey = async () => {
    if (!projectId) return;

    // WordPress URL is required for publishing
    if (!wordPressSiteUrl.trim()) {
      alert('Please enter your WordPress site URL (e.g., https://yoursite.com)');
      return;
    }

    try {
      // Check if integration exists
      let integrationId = wordPressIntegration?.id;

      if (!integrationId) {
        // Create a new integration with the WordPress URL
        const createRes = await apiPost('/api/integrations', {
          projectId,
          platform: 'wordpress',
          credentials: {
            url: wordPressSiteUrl.trim(),
          },
          isActive: false,
        });

        if (createRes.error) {
          alert(createRes.error || 'Failed to create integration');
          return;
        }

        integrationId = createRes.data?.integration?.id;
      } else {
        // Update existing integration with WordPress URL if not set
        const updateRes = await fetch(`/api/integrations/${integrationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            credentials: {
              ...(wordPressIntegration.credentials as any || {}),
              url: wordPressSiteUrl.trim(),
            },
          }),
        }).then(r => r.json());

        if (updateRes.error) {
          alert(updateRes.error || 'Failed to update integration');
          return;
        }
      }

      // Reload integrations to get the new key
      const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
      setIntegrations(integrationsRes.data?.integrations || []);
      setShowIntegrationKey(true);
    } catch (error: any) {
      console.error('Failed to generate integration key:', error);
      alert(error.message || 'Failed to generate integration key');
    }
  };

  const handleActivateIntegration = async () => {
    if (!wordPressIntegration?.id) return;

    try {
      const res = await fetch(`/api/integrations/${wordPressIntegration.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isActive: true,
        }),
      }).then(r => r.json());

      if (res.error) {
        alert(res.error || 'Failed to activate integration');
        return;
      }

      // Reload integrations
      const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
      setIntegrations(integrationsRes.data?.integrations || []);
      alert('Integration activated! Articles will now automatically publish to WordPress.');
    } catch (error: any) {
      console.error('Failed to activate integration:', error);
      alert(error.message || 'Failed to activate integration');
    }
  };

  const handleTestPublish = async () => {
    if (!projectId) {
      alert('No project found');
      return;
    }

    // Debug logging
    console.log('[Frontend] ========================================');
    console.log('[Frontend] Test Publish - Project ID:', projectId);
    console.log('[Frontend] Test Publish - WordPress Integration:', JSON.stringify(wordPressIntegration, null, 2));
    console.log('[Frontend] Test Publish - All Integrations:', JSON.stringify(integrations, null, 2));
    console.log('[Frontend] Test Publish - Integration Key:', integrationKey);
    console.log('[Frontend] Test Publish - Is Connected:', isWordPressConnected);
    console.log('[Frontend] ========================================');

    try {
      const res = await fetch('/api/integrations/wordpress/test-publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      }).then(r => r.json());

      console.log('[Frontend] Test Publish Response:', res);

      if (res.error) {
        alert(`Test failed: ${res.error}`);
        return;
      }

      if (res.data?.success) {
        alert('✅ Test successful! WordPress connection is working.');
      } else {
        const details = res.data?.details || {};
        let message = `❌ Test failed: ${res.data?.error || 'Unknown error'}\n\n`;
        message += `Details:\n`;
        message += `- Integration exists: ${details.hasIntegration ? 'Yes' : 'No'}\n`;
        message += `- Integration active: ${details.integrationActive ? 'Yes' : 'No'}\n`;
        message += `- Has integration key: ${details.hasIntegrationKey ? 'Yes' : 'No'}\n`;
        message += `- Has WordPress URL: ${details.hasWordPressUrl ? 'Yes' : 'No'}\n`;
        if (details.projectId) {
          message += `- Project ID: ${details.projectId}\n`;
        }
        if (details.wordPressUrl) {
          message += `- WordPress URL: ${details.wordPressUrl}\n`;
        }
        if (details.responseStatus) {
          message += `- Response status: ${details.responseStatus}\n`;
        }
        if (details.connectionError) {
          message += `- Connection error: ${details.connectionError}\n`;
        }
        alert(message);
      }
    } catch (error: any) {
      alert(`Test error: ${error.message}`);
    }
  };

  const handleRegenerateKey = async () => {
    if (!wordPressIntegration?.id || !confirm('Are you sure you want to regenerate the integration key? The old key will no longer work.')) {
      return;
    }

    try {
      // Create a new integration key by updating the integration
      const res = await fetch(`/api/integrations/${wordPressIntegration.id}/regenerate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).then(r => r.json());

      if (res.error) {
        alert(res.error || 'Failed to regenerate key');
        return;
      }

      // Reload integrations
      const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
      setIntegrations(integrationsRes.data?.integrations || []);
      setShowIntegrationKey(true);
      alert('Integration key regenerated successfully!');
    } catch (error: any) {
      console.error('Failed to regenerate key:', error);
      alert(error.message || 'Failed to regenerate key');
    }
  };

  const platforms = [
    { name: 'WordPress', logo: 'W', color: 'bg-gray-900', key: 'wordpress' },
    { name: 'Wix', logo: 'WIX', color: 'bg-gray-900', key: 'wix' },
    { name: 'Shopify', logo: 'S', color: 'bg-green-500', isIcon: true, key: 'shopify' },
    { name: 'WordPress.com', logo: 'W', color: 'bg-blue-500', key: 'wordpress-com' },
    { name: 'Webflow', logo: 'W', color: 'bg-blue-500', key: 'webflow' },
    { name: 'Zapier', logo: 'Z', color: 'bg-orange-500', key: 'zapier' },
    { name: 'Make', logo: 'M', color: 'bg-purple-500', key: 'make' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Integration settings</h1>
        <p className="text-gray-600 mb-8">Set up an integration to enable automated publishing.</p>

        {/* Integration Section */}
        <div className="space-y-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Integration</h2>
              <p className="text-sm text-gray-600">Automatically publish articles to your website</p>
            </div>
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">No platform connected yet</h3>
                  <p className="text-sm text-gray-600">
                    Connect your website to automatically publish articles to your website.
                  </p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-3">
                {platforms.map((platform, index) => {
                  const integration = integrations.find((i: any) => i.platform === platform.key);
                  const isConnected = integration?.isActive;

                  if (platform.key === 'wordpress') {
                    return (
                      <div key={index} className="space-y-3">
                        <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 ${platform.color} rounded flex items-center justify-center text-white font-bold`}>
                              {platform.logo}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{platform.name}</span>
                                {isConnected && (
                                  <span className="text-xs text-green-600">● Connected</span>
                                )}
                              </div>
                              {/* WordPress URL Display/Edit */}
                              {isConnected && (
                                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                                  <p className="text-xs font-medium text-gray-700 mb-2">WordPress Site URL:</p>
                                  <div className="flex gap-2">
                                    <input
                                      type="url"
                                      value={wordPressSiteUrl || (wordPressIntegration?.credentials as any)?.url || ''}
                                      onChange={(e) => setWordPressSiteUrl(e.target.value)}
                                      placeholder="https://yoursite.com"
                                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button
                                      onClick={async () => {
                                        if (!wordPressIntegration?.id || !wordPressSiteUrl.trim()) {
                                          alert('Please enter a WordPress URL');
                                          return;
                                        }
                                        try {
                                          const updateRes = await fetch(`/api/integrations/${wordPressIntegration.id}`, {
                                            method: 'PATCH',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                              credentials: {
                                                ...(wordPressIntegration.credentials as any || {}),
                                                url: wordPressSiteUrl.trim(),
                                              },
                                            }),
                                          }).then(r => r.json());

                                          if (updateRes.error) {
                                            alert(updateRes.error || 'Failed to update URL');
                                            return;
                                          }

                                          // Reload integrations
                                          const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
                                          setIntegrations(integrationsRes.data?.integrations || []);
                                          alert('WordPress URL updated successfully!');
                                        } catch (error: any) {
                                          alert(error.message || 'Failed to update URL');
                                        }
                                      }}
                                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                                    >
                                      Update
                                    </button>
                                  </div>
                                  {!(wordPressIntegration?.credentials as any)?.url && (
                                    <p className="text-xs text-red-600 mt-1">⚠️ WordPress URL is missing - please add it above</p>
                                  )}
                                </div>
                              )}

                              {integrationKey && (
                                <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-xs font-medium text-gray-700 mb-1">Integration Key:</p>
                                      <code className="text-xs font-mono text-gray-900 break-all">
                                        {showIntegrationKey ? integrationKey : `${integrationKey.substring(0, 30)}...`}
                                      </code>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(integrationKey);
                                          alert('Integration key copied!');
                                        }}
                                        className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                                      >
                                        Copy
                                      </button>
                                      <button
                                        onClick={() => setShowIntegrationKey(!showIntegrationKey)}
                                        className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                                      >
                                        {showIntegrationKey ? 'Hide' : 'Show'}
                                      </button>
                                      <button
                                        onClick={handleRegenerateKey}
                                        className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                                        title="Regenerate integration key"
                                      >
                                        ↻
                                      </button>
                                    </div>
                                  </div>
                                  {!isConnected && (
                                    <div className="mt-2 pt-2 border-t border-purple-200">
                                      <button
                                        onClick={handleActivateIntegration}
                                        className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                                      >
                                        Activate Integration
                                      </button>
                                      <p className="text-xs text-gray-500 mt-1">
                                        Activate to enable automatic publishing to WordPress
                                      </p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isConnected ? (
                              <>
                                <button
                                  onClick={handleTestPublish}
                                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                  title="Test WordPress connection"
                                >
                                  Test Connection
                                </button>
                                <button
                                  onClick={() => setShowIntegrationKey(!showIntegrationKey)}
                                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                >
                                  {showIntegrationKey ? 'Hide Key' : 'Show Key'}
                                </button>
                                <button
                                  onClick={() => handleDisconnect(integration.id)}
                                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
                                >
                                  Disconnect
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => setShowWordPressPlugin(!showWordPressPlugin)}
                                  className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                                >
                                  Connect
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {showWordPressPlugin && !isConnected && (
                          <div className="ml-14 p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">WordPress Plugin (Recommended)</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                Install our WordPress plugin and connect using your integration key.
                              </p>
                              
                              {/* WordPress Site URL */}
                              <div className="mb-4 p-3 bg-white border border-gray-300 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  WordPress Site URL
                                </label>
                                <div className="flex gap-2 mb-2">
                                  <input
                                    type="url"
                                    placeholder="https://yoursite.com"
                                    value={wordPressSiteUrl}
                                    onChange={(e) => setWordPressSiteUrl(e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                  />
                                  {wordPressIntegration?.id && wordPressSiteUrl.trim() && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          const updateRes = await fetch(`/api/integrations/${wordPressIntegration.id}`, {
                                            method: 'PATCH',
                                            headers: {
                                              'Content-Type': 'application/json',
                                            },
                                            body: JSON.stringify({
                                              credentials: {
                                                ...(wordPressIntegration.credentials as any || {}),
                                                url: wordPressSiteUrl.trim(),
                                              },
                                            }),
                                          }).then(r => r.json());

                                          if (updateRes.error) {
                                            alert(updateRes.error || 'Failed to update URL');
                                            return;
                                          }

                                          // Reload integrations
                                          const integrationsRes = await apiGet(`/api/integrations?projectId=${projectId}`);
                                          setIntegrations(integrationsRes.data?.integrations || []);
                                          alert('WordPress URL updated successfully!');
                                        } catch (error: any) {
                                          alert(error.message || 'Failed to update URL');
                                        }
                                      }}
                                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                    >
                                      Save URL
                                    </button>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  Enter your WordPress site URL (required for publishing)
                                  {wordPressIntegration?.credentials && !(wordPressIntegration.credentials as any)?.url && (
                                    <span className="text-red-600 block mt-1">⚠️ WordPress URL is missing - please add it above</span>
                                  )}
                                </p>
                              </div>

                              {/* Integration Key Section */}
                              <div className="mb-4 p-3 bg-white border border-gray-300 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <label className="text-sm font-medium text-gray-700">Integration Key</label>
                                  <button
                                    onClick={handleGenerateIntegrationKey}
                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                  >
                                    {integrationKey ? 'Regenerate' : 'Generate Key'}
                                  </button>
                                </div>
                                {integrationKey ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                      <code className="flex-1 px-3 py-2 bg-gray-100 rounded text-sm font-mono break-all">
                                        {showIntegrationKey ? integrationKey : `${integrationKey.substring(0, 20)}...`}
                                      </code>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(integrationKey);
                                          alert('Integration key copied!');
                                        }}
                                        className="px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                                      >
                                        Copy
                                      </button>
                                      <button
                                        onClick={() => setShowIntegrationKey(!showIntegrationKey)}
                                        className="px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                                      >
                                        {showIntegrationKey ? 'Hide' : 'Show'}
                                      </button>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Copy this key and paste it in your WordPress plugin settings
                                    </p>
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500 italic">
                                    Enter WordPress URL above, then click "Generate Key"
                                  </p>
                                )}
                              </div>

                              <div className="space-y-2 mb-4">
                                <button
                                  onClick={handleDownloadPlugin}
                                  className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                >
                                  Download Plugin
                                </button>
                                <p className="text-xs text-gray-500">
                                  1. Download and install the plugin on your WordPress site<br />
                                  2. Go to RankYak → Settings in WordPress admin<br />
                                  3. Enter your integration key and click "Connect"
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-gray-300 pt-4">
                              <h4 className="font-semibold text-gray-900 mb-2">WordPress REST API (Alternative)</h4>
                              <p className="text-sm text-gray-600 mb-3">
                                Connect using WordPress username and password (less secure)
                              </p>
                              <div className="space-y-3">
                                <input
                                  type="url"
                                  placeholder="WordPress Site URL (e.g., https://yoursite.com)"
                                  value={wordPressUrl}
                                  onChange={(e) => setWordPressUrl(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <input
                                  type="text"
                                  placeholder="WordPress Username"
                                  value={wordPressUsername}
                                  onChange={(e) => setWordPressUsername(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <input
                                  type="password"
                                  placeholder="WordPress Password"
                                  value={wordPressPassword}
                                  onChange={(e) => setWordPressPassword(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                                <button
                                  onClick={handleWordPressRESTConnect}
                                  disabled={isConnecting}
                                  className="w-full bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
                                >
                                  {isConnecting ? 'Connecting...' : 'Connect via REST API'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${platform.color} rounded flex items-center justify-center text-white font-bold`}>
                          {platform.logo}
                        </div>
                        <span className="font-medium text-gray-900">{platform.name}</span>
                      </div>
                      <button className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm">
                        Connect
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RSS Feed Section */}
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">RSS feed</h2>
              <p className="text-sm text-gray-600">An RSS feed of your articles</p>
            </div>
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">RSS feed is currently disabled</h3>
                  <p className="text-sm text-gray-600">
                    Use the RSS feed to allow other platforms to fetch your articles.
                  </p>
                </div>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Section */}
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Webhook</h2>
              <p className="text-sm text-gray-600">Receive the articles via a webhook</p>
            </div>
            <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Webhooks are currently disabled</h3>
                  <p className="text-sm text-gray-600">
                    Use a webhook to receive the articles in at a URL of your choice.
                  </p>
                </div>
                <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
