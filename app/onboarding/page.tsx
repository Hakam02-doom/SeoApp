'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiPost, apiPatch } from '@/lib/api-client';
import { useAuth } from '@/lib/hooks/use-auth';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isEditingUrl, setIsEditingUrl] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    coreBusiness: string;
    keyFeatures: string[];
    description: string;
    targetAudience?: {
      primaryAudience: string;
      businessNeeds: string[];
      technicalProficiency: string;
      painPoints: string[];
      goals: string[];
    };
  } | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [descriptionConfirmed, setDescriptionConfirmed] = useState(false);
  const [targetAudienceConfirmed, setTargetAudienceConfirmed] = useState(false);
  const [languageConfirmed, setLanguageConfirmed] = useState(false);
  const [country, setCountry] = useState('United States');
  const [language, setLanguage] = useState('English');
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [coreTopicsConfirmed, setCoreTopicsConfirmed] = useState(false);
  const [isGeneratingTopics, setIsGeneratingTopics] = useState(false);
  const [coreTopics, setCoreTopics] = useState<Array<{ topic: string; searchVolume?: number; difficulty?: number }>>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Normalize URL for API call
  const normalizeUrl = (url: string) => {
    if (!url) return '';
    let normalized = url.trim();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = `https://${normalized}`;
    }
    return normalized;
  };

  const handleGenerateCoreTopics = async () => {
    if (!projectId || isGeneratingTopics) return;

    setIsGeneratingTopics(true);
    setError('');

    try {
      const response = await apiPost('/api/onboarding/generate-core-topics', {
        projectId,
      });

      if (response.error) {
        setError(response.error);
        setIsGeneratingTopics(false);
        return;
      }

      if (response.data?.topics) {
        setCoreTopics(response.data.topics);
        setIsGeneratingTopics(false);
      } else {
        setError('Failed to generate core topics');
        setIsGeneratingTopics(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate core topics');
      setIsGeneratingTopics(false);
    }
  };

  const handleAnalyze = async () => {
    if (!websiteUrl.trim()) return;

    setIsAnalyzing(true);
    setError('');
    setAiAnalysis(null);
    
    const urlToAnalyze = normalizeUrl(websiteUrl);
    
    try {
      const response = await apiPost('/api/onboarding/analyze', {
        websiteUrl: urlToAnalyze,
      });

      if (response.error) {
        if (response.error.includes('Unauthorized') || response.error.includes('Authentication required')) {
          router.push('/login');
          return;
        }
        const errorMessage = response.error.includes('SCRAPER_API_KEY') 
          ? 'Scraper API key not configured. Please set SCRAPER_API_KEY in your environment variables.'
          : response.error;
        setError(errorMessage);
        setIsAnalyzing(false);
        return;
      }

      // Extract AI analysis from response
      if (response.data?.aiAnalysis) {
        setAiAnalysis(response.data.aiAnalysis);
        setIsAnalyzing(false);
        // Stay on step 1 to show description first
      } else if (response.data?.project?.brandVoice) {
        // Fallback to brandVoice if aiAnalysis not in response
        const brandVoice = response.data.project.brandVoice as any;
        if (brandVoice.coreBusiness || brandVoice.keyFeatures || brandVoice.description) {
          setAiAnalysis({
            coreBusiness: brandVoice.coreBusiness || '',
            keyFeatures: brandVoice.keyFeatures || [],
            description: brandVoice.description || '',
            targetAudience: brandVoice.targetAudience,
          });
          setIsAnalyzing(false);
        }
      }

      if (response.data?.project) {
        const newProjectId = response.data.project.id;
        setProjectId(newProjectId);
        // Don't redirect immediately - let user see the AI analysis first
      } else {
        setError('Failed to create project');
        setIsAnalyzing(false);
      }
    } catch (err: any) {
      console.error('[Onboarding] Form submission error:', err);
      setError(err.message || 'Failed to analyze website');
      setIsAnalyzing(false);
    }
  };

  // Extract domain from URL
  const getDomain = (url: string) => {
    if (!url) return '';
    try {
      // Remove protocol if present
      let cleanUrl = url.trim().replace(/^https?:\/\//, '');
      // Remove www if present
      cleanUrl = cleanUrl.replace(/^www\./, '');
      // Get just the domain part (before first slash)
      const domain = cleanUrl.split('/')[0].split('?')[0];
      return domain;
    } catch {
      return url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  };

  const displayDomain = websiteUrl ? getDomain(websiteUrl) : '';

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-gray-600">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-700">
            <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-sm font-bold">↑</span>
            </div>
            <span className="text-xl font-bold">RankYak</span>
          </Link>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="text-sm text-gray-600 mb-2">Step {step} of 5</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => {
              const isCompleted = 
                (s === 1 && descriptionConfirmed) ||
                (s === 2 && targetAudienceConfirmed) ||
                (s === 3 && languageConfirmed) ||
                (s === 4 && coreTopicsConfirmed);
              return (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full transition-colors ${
                    isCompleted ? 'bg-green-600' : s === step ? 'bg-purple-600' : 'bg-gray-200'
                  }`}
                />
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Main Content */}
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Let's get started</h1>
            <p className="text-xl text-gray-600 mb-8">Tell us about your website</p>

            {/* Website URL Input */}
            <div className="mb-8">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                {isEditingUrl ? (
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onBlur={() => setIsEditingUrl(false)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setIsEditingUrl(false);
                      }
                    }}
                    placeholder="rankyak.com"
                    className="w-full pl-12 pr-12 py-4 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-lg"
                    autoFocus
                  />
                ) : (
                  <div
                    onClick={() => setIsEditingUrl(true)}
                    className="w-full pl-12 pr-12 py-4 border-2 border-purple-300 rounded-lg cursor-text hover:border-purple-400 transition-colors flex items-center"
                  >
                    <span className="text-lg text-gray-900">
                      {displayDomain || 'rankyak.com'}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setIsEditingUrl(true)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Step 1: Description Section */}
            <div className="mb-4">
              <button
                onClick={() => setExpandedStep(expandedStep === 1 ? null : 1)}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">1. Description</h2>
                  {descriptionConfirmed && (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedStep === 1 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedStep === 1 && (
                <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-lg">
                
                {isAnalyzing && !aiAnalysis ? (
                  <div className="mb-6 p-6 bg-purple-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg
                        className="animate-spin h-5 w-5 text-purple-600"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span className="text-purple-700 font-medium">AI is analyzing your website...</span>
                    </div>
                  </div>
                ) : aiAnalysis ? (
                  <>
                    {/* Core Business */}
                    {aiAnalysis.coreBusiness && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Core Business</h3>
                        <p className="text-gray-700 leading-relaxed">{aiAnalysis.coreBusiness}</p>
                      </div>
                    )}

                    {/* Key Features */}
                    {aiAnalysis.keyFeatures && aiAnalysis.keyFeatures.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Key Features</h3>
                        <ul className="space-y-3">
                          {aiAnalysis.keyFeatures.map((feature, index) => {
                            // Parse feature format: "Feature Name: Description"
                            const parts = feature.split(':');
                            const featureName = parts[0]?.trim() || '';
                            const featureDesc = parts.slice(1).join(':').trim() || feature;
                            
                            return (
                              <li key={index} className="flex items-start gap-3">
                                <span className="text-purple-600 mt-1">•</span>
                                <span className="text-gray-700">
                                  {featureName && (
                                    <strong>{featureName}:</strong>
                                  )}{' '}
                                  {featureDesc}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}

                    {!descriptionConfirmed && (
                      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-purple-800 font-medium mb-3">
                          Our AI Agent thinks this describes your business. Does it look right?
                        </p>
                        <button
                          onClick={() => {
                            setDescriptionConfirmed(true);
                            setExpandedStep(null); // Minimize this step
                            if (aiAnalysis?.targetAudience) {
                              setStep(2);
                              setExpandedStep(2); // Expand next step
                            } else {
                              setStep(3);
                              setExpandedStep(3);
                            }
                          }}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Yes, spot on!
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-gray-600 text-sm">
                      Enter your website URL above and click "Analyze Website" to generate an AI-powered description and key features.
                    </p>
                  </div>
                )}
                </div>
              )}
            </div>

            {/* Step 2: Target Audience Section */}
            {aiAnalysis?.targetAudience && (
              <div className="mb-4">
                <button
                  onClick={() => setExpandedStep(expandedStep === 2 ? null : 2)}
                  className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-900">2. Target audience</h2>
                    {targetAudienceConfirmed && (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <svg
                    className={`w-5 h-5 text-gray-500 transition-transform ${expandedStep === 2 ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedStep === 2 && (
                  <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-lg">
                    {/* Primary Audience */}
                    {aiAnalysis.targetAudience.primaryAudience && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Primary Audience</h3>
                        <p className="text-gray-700 leading-relaxed">{aiAnalysis.targetAudience.primaryAudience}</p>
                      </div>
                    )}

                    {/* Key Characteristics */}
                    <div className="space-y-6">
                      {/* Business Needs */}
                      {aiAnalysis.targetAudience.businessNeeds && aiAnalysis.targetAudience.businessNeeds.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Business Needs</h3>
                          <ul className="space-y-2">
                            {aiAnalysis.targetAudience.businessNeeds.map((need, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="text-purple-600 mt-1">•</span>
                                <span className="text-gray-700">{need}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Technical Proficiency */}
                      {aiAnalysis.targetAudience.technicalProficiency && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Technical Proficiency</h3>
                          <p className="text-gray-700 leading-relaxed">{aiAnalysis.targetAudience.technicalProficiency}</p>
                        </div>
                      )}

                      {/* Pain Points */}
                      {aiAnalysis.targetAudience.painPoints && aiAnalysis.targetAudience.painPoints.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pain Points</h3>
                          <ul className="space-y-2">
                            {aiAnalysis.targetAudience.painPoints.map((point, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="text-purple-600 mt-1">•</span>
                                <span className="text-gray-700">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Goals */}
                      {aiAnalysis.targetAudience.goals && aiAnalysis.targetAudience.goals.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Goals</h3>
                          <ul className="space-y-2">
                            {aiAnalysis.targetAudience.goals.map((goal, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <span className="text-purple-600 mt-1">•</span>
                                <span className="text-gray-700">{goal}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {!targetAudienceConfirmed && (
                      <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <p className="text-purple-800 font-medium mb-3">
                          Our AI Agent thinks this is who your target audience is. Does it look right?
                        </p>
                        <button
                          onClick={() => {
                            setTargetAudienceConfirmed(true);
                            setExpandedStep(null); // Minimize this step
                            setStep(3);
                            setExpandedStep(3); // Expand next step
                          }}
                          className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          Yes, spot on!
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Language Section */}
            <div className="mb-4">
              <button
                onClick={() => setExpandedStep(expandedStep === 3 ? null : 3)}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">3. Language</h2>
                  {languageConfirmed && (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedStep === 3 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedStep === 3 && (
                <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                      >
                        <option value="United States">United States</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Canada">Canada</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Spain">Spain</option>
                        <option value="Italy">Italy</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Austria">Austria</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Norway">Norway</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Finland">Finland</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Ireland">Ireland</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Japan">Japan</option>
                        <option value="South Korea">South Korea</option>
                        <option value="China">China</option>
                        <option value="India">India</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Argentina">Argentina</option>
                        <option value="Chile">Chile</option>
                        <option value="South Africa">South Africa</option>
                        <option value="United Arab Emirates">United Arab Emirates</option>
                        <option value="Singapore">Singapore</option>
                        <option value="Malaysia">Malaysia</option>
                        <option value="Indonesia">Indonesia</option>
                        <option value="Thailand">Thailand</option>
                        <option value="Philippines">Philippines</option>
                        <option value="Vietnam">Vietnam</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                        <option value="Israel">Israel</option>
                        <option value="Russia">Russia</option>
                        <option value="Czech Republic">Czech Republic</option>
                        <option value="Hungary">Hungary</option>
                        <option value="Romania">Romania</option>
                        <option value="Greece">Greece</option>
                        <option value="Bulgaria">Bulgaria</option>
                        <option value="Croatia">Croatia</option>
                        <option value="Serbia">Serbia</option>
                        <option value="Slovakia">Slovakia</option>
                        <option value="Slovenia">Slovenia</option>
                        <option value="Estonia">Estonia</option>
                        <option value="Latvia">Latvia</option>
                        <option value="Lithuania">Lithuania</option>
                        <option value="Ukraine">Ukraine</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 appearance-none bg-white"
                      >
                        <option value="English">English</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                        <option value="German">German</option>
                        <option value="Italian">Italian</option>
                        <option value="Portuguese">Portuguese</option>
                        <option value="Dutch">Dutch</option>
                        <option value="Russian">Russian</option>
                        <option value="Chinese (Simplified)">Chinese (Simplified)</option>
                        <option value="Chinese (Traditional)">Chinese (Traditional)</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Korean">Korean</option>
                        <option value="Arabic">Arabic</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Turkish">Turkish</option>
                        <option value="Polish">Polish</option>
                        <option value="Romanian">Romanian</option>
                        <option value="Czech">Czech</option>
                        <option value="Greek">Greek</option>
                        <option value="Swedish">Swedish</option>
                        <option value="Norwegian">Norwegian</option>
                        <option value="Danish">Danish</option>
                        <option value="Finnish">Finnish</option>
                        <option value="Hungarian">Hungarian</option>
                        <option value="Bulgarian">Bulgarian</option>
                        <option value="Croatian">Croatian</option>
                        <option value="Serbian">Serbian</option>
                        <option value="Slovak">Slovak</option>
                        <option value="Slovenian">Slovenian</option>
                        <option value="Estonian">Estonian</option>
                        <option value="Latvian">Latvian</option>
                        <option value="Lithuanian">Lithuanian</option>
                        <option value="Macedonian">Macedonian</option>
                        <option value="Bosnian">Bosnian</option>
                        <option value="Hebrew">Hebrew</option>
                        <option value="Urdu">Urdu</option>
                        <option value="Bengali">Bengali</option>
                        <option value="Thai">Thai</option>
                        <option value="Vietnamese">Vietnamese</option>
                        <option value="Indonesian">Indonesian</option>
                        <option value="Malay">Malay</option>
                        <option value="Tagalog">Tagalog</option>
                        <option value="Armenian">Armenian</option>
                        <option value="Azeri">Azeri</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg mb-4">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-orange-800">
                      Select the country and language that best represents your target audience.
                    </p>
                  </div>

                  {!languageConfirmed && (
                    <button
                      onClick={async () => {
                        if (!projectId) {
                          setError('Project not found. Please start over.');
                          return;
                        }
                        
                        try {
                          // Map language name to language code
                          const languageMap: Record<string, string> = {
                            'english': 'en',
                            'spanish': 'es',
                            'french': 'fr',
                            'german': 'de',
                            'italian': 'it',
                            'portuguese': 'pt',
                            'dutch': 'nl',
                            'russian': 'ru',
                            'japanese': 'ja',
                            'korean': 'ko',
                            'chinese (simplified)': 'zh',
                            'chinese (traditional)': 'zh-tw',
                            'arabic': 'ar',
                            'hindi': 'hi',
                            'turkish': 'tr',
                            'polish': 'pl',
                            'swedish': 'sv',
                            'norwegian': 'no',
                            'danish': 'da',
                            'finnish': 'fi',
                            'hungarian': 'hu',
                            'romanian': 'ro',
                            'czech': 'cs',
                            'greek': 'el',
                            'bulgarian': 'bg',
                            'croatian': 'hr',
                            'serbian': 'sr',
                            'slovak': 'sk',
                            'slovenian': 'sl',
                            'estonian': 'et',
                            'latvian': 'lv',
                            'lithuanian': 'lt',
                            'macedonian': 'mk',
                            'bosnian': 'bs',
                            'hebrew': 'he',
                            'urdu': 'ur',
                            'bengali': 'bn',
                            'thai': 'th',
                            'vietnamese': 'vi',
                            'indonesian': 'id',
                            'malay': 'ms',
                            'tagalog': 'tl',
                            'armenian': 'hy',
                            'azeri': 'az',
                          };
                          
                          const langCode = languageMap[language.toLowerCase()] || 'en';
                          
                          // Update project with language settings
                          const response = await apiPatch(`/api/projects/${projectId}/update-language`, {
                            language: langCode,
                            country: country,
                          });
                          
                          if (response.error) {
                            setError(response.error);
                            return;
                          }
                          
                          setLanguageConfirmed(true);
                          setExpandedStep(null);
                          setStep(4);
                          setExpandedStep(4);
                          // Auto-generate core topics when language is confirmed
                          handleGenerateCoreTopics();
                        } catch (err: any) {
                          setError(err.message || 'Failed to update language settings');
                        }
                      }}
                      className="w-full bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg font-semibold"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Step 4: Core Topics Section */}
            <div className="mb-4">
              <button
                onClick={() => setExpandedStep(expandedStep === 4 ? null : 4)}
                className="w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-gray-900">4. Core topics</h2>
                  {coreTopicsConfirmed && (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <svg
                  className={`w-5 h-5 text-gray-500 transition-transform ${expandedStep === 4 ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedStep === 4 && (
                <div className="mt-4 p-6 bg-white border-2 border-gray-200 rounded-lg">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Core topics</h2>
                  <p className="text-gray-600 mb-6">
                    The core topics determine the primary ranking strategy for your project. They are used to guide keyword research, content creation, and SEO efforts.
                  </p>

                  {isGeneratingTopics ? (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
                      <div className="flex items-center justify-center gap-3 mb-4">
                        <svg
                          className="animate-spin h-6 w-6 text-purple-600"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        <span className="text-lg font-semibold text-gray-900">
                          We are generating core topics for your website
                        </span>
                      </div>
                      <p className="text-gray-600 mb-2">
                        Each topic will be based on real search data, including search volume and keyword difficulty.
                      </p>
                      <p className="text-sm text-gray-500">
                        This may take up to a minute, please wait...
                      </p>
                    </div>
                  ) : coreTopics.length > 0 ? (
                    <div className="space-y-4 mb-6">
                      {coreTopics.map((topic, index) => (
                        <div
                          key={index}
                          className="p-4 bg-purple-50 border border-purple-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{topic.topic}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {topic.searchVolume && (
                                <span>Volume: {topic.searchVolume.toLocaleString()}</span>
                              )}
                              {topic.difficulty !== undefined && (
                                <span className={`px-2 py-1 rounded ${
                                  topic.difficulty < 30 ? 'bg-green-100 text-green-700' :
                                  topic.difficulty < 60 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  Difficulty: {topic.difficulty}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-8 text-center">
                      <p className="text-gray-600 mb-4">
                        Core topics will be generated based on your website analysis and target audience.
                      </p>
                      <button
                        onClick={handleGenerateCoreTopics}
                        disabled={!projectId || isGeneratingTopics}
                        className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                      >
                        Generate Core Topics
                      </button>
                    </div>
                  )}

                  {!coreTopicsConfirmed && coreTopics.length > 0 && (
                    <button
                      onClick={() => {
                        setCoreTopicsConfirmed(true);
                        setExpandedStep(null);
                        if (projectId) {
                          window.location.href = `/onboarding/results?projectId=${projectId}`;
                        }
                      }}
                      className="w-full bg-gray-900 text-white px-8 py-4 rounded-lg hover:bg-gray-800 transition-colors text-lg font-semibold"
                    >
                      Continue
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Analyze Button - Only show when step 1 is expanded and no analysis yet */}
            {expandedStep === 1 && !aiAnalysis && (
              <div className="mt-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !websiteUrl.trim()}
                  className="w-full bg-purple-600 text-white px-8 py-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold flex items-center justify-center gap-3"
                >
                  {isAnalyzing ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Analyzing with AI...
                    </>
                  ) : (
                      'Analyze Website'
                    )}
                </button>
              </div>
            )}
          </div>

          {/* Right Panel - Gradient Background */}
          <div className="hidden lg:block bg-gradient-to-br from-purple-100 via-pink-100 to-purple-50 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
