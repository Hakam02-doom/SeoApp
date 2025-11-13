'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { apiGet, apiPost } from '@/lib/api-client';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [projectId, setProjectId] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Load project and calendar data
  useEffect(() => {
    async function loadCalendar() {
      try {
        setIsLoading(true);
        
        // Get first project
        const projectsRes = await apiGet('/api/projects');
        if (projectsRes.data?.projects && projectsRes.data.projects.length > 0) {
          const pid = projectsRes.data.projects[0].id;
          setProjectId(pid);

          // Load calendar data for current month
          const calendarRes = await apiGet(
            `/api/calendar?projectId=${pid}&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth()}`
          );
          
          if (calendarRes.data) {
            setCalendarData(calendarRes.data);
          }
        }
      } catch (error) {
        console.error('Failed to load calendar:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCalendar();
  }, [currentMonth]);

  const handleGeneratePlan = async (replaceExisting: boolean) => {
    if (!projectId) return;

    setIsGeneratingPlan(true);
    try {
      const response = await apiPost('/api/keywords/generate-plan', {
        projectId,
        replaceExisting,
      });

      if (response.error) {
        alert(response.error);
        return;
      }

      setShowPlanModal(false);
      
      // Reload calendar data
      const calendarRes = await apiGet(
        `/api/calendar?projectId=${projectId}&year=${currentMonth.getFullYear()}&month=${currentMonth.getMonth()}`
      );
      
      if (calendarRes.data) {
        setCalendarData(calendarRes.data);
      }
      
      // Show success message
      alert(`Successfully generated ${response.data?.plan?.keywordsCreated || 0} keywords for your 30-day plan!`);
    } catch (error: any) {
      alert(error.message || 'Failed to generate keyword plan');
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const days = Array.from({ length: getDaysInMonth(currentMonth) }, (_, i) => i + 1);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              Calendar
              <span className="text-gray-400 text-xl">ℹ️</span>
            </h1>
            <p className="text-gray-600">View and manage your content plan and keyword schedule.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPlanModal(true)}
              disabled={!projectId || isGeneratingPlan}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              Generate 30-Day Plan
            </button>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              ←
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              →
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {emptyDays.map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square"></div>
            ))}
            {isLoading ? (
              <div className="col-span-7 text-center py-12">Loading calendar...</div>
            ) : (
              days.map((day) => {
                const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                const dayKeywords = calendarData?.plannedKeywords?.filter((k: any) => {
                  if (!k.plannedDate) return false;
                  const planned = new Date(k.plannedDate);
                  return (
                    planned.getDate() === day &&
                    planned.getMonth() === currentMonth.getMonth() &&
                    planned.getFullYear() === currentMonth.getFullYear()
                  );
                }) || [];
                const dayArticles = calendarData?.scheduledArticles?.filter((a: any) => {
                  if (!a.publishedAt) return false;
                  const published = new Date(a.publishedAt);
                  return (
                    published.getDate() === day &&
                    published.getMonth() === currentMonth.getMonth() &&
                    published.getFullYear() === currentMonth.getFullYear()
                  );
                }) || [];

                const isToday = 
                  day === new Date().getDate() &&
                  currentMonth.getMonth() === new Date().getMonth() &&
                  currentMonth.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-2 ${
                      isToday 
                        ? 'border-blue-500 bg-blue-50' 
                        : dayKeywords.length > 0 || dayArticles.length > 0 
                        ? 'border-gray-200 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-700 font-bold' : 'text-gray-900'}`}>
                      {day}
                    </div>
                    {dayKeywords.length > 0 && (
                      <div className="text-xs space-y-1 mb-1">
                        {dayKeywords.slice(0, 2).map((k: any) => (
                          <div 
                            key={k.id} 
                            className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded truncate"
                            title={k.keyword}
                          >
                            {k.keyword}
                          </div>
                        ))}
                        {dayKeywords.length > 2 && (
                          <div className="text-gray-500 text-xs">+{dayKeywords.length - 2} more</div>
                        )}
                      </div>
                    )}
                    {dayArticles.length > 0 && (
                      <div className="text-xs mt-1">
                        {dayArticles.map((a: any) => (
                          <div
                            key={a.id}
                            className={`inline-block px-1.5 py-0.5 rounded text-xs mb-1 ${
                              a.status === 'published'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            📝 {a.status}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Generate Plan Modal */}
        {showPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-bold mb-4">Generate 30-Day Keyword Plan</h2>
              <p className="text-gray-600 mb-4">
                This will generate 30-60 SEO-optimized keywords related to your services and distribute them across the next 30 days. Keywords will appear on your calendar.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">What will be generated:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Keywords related to your services</li>
                  <li>• Mix of informational, commercial, and transactional keywords</li>
                  <li>• Keywords distributed across 30 days</li>
                  <li>• Estimated search volume and difficulty scores</li>
                  <li>• Strategic progression from easy to competitive keywords</li>
                </ul>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGeneratePlan(false)}
                  disabled={isGeneratingPlan || !projectId}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
                </button>
                <button
                  onClick={() => handleGeneratePlan(true)}
                  disabled={isGeneratingPlan || !projectId}
                  className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  {isGeneratingPlan ? 'Generating...' : 'Replace Existing'}
                </button>
                <button
                  onClick={() => setShowPlanModal(false)}
                  disabled={isGeneratingPlan}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
              {isGeneratingPlan && (
                <div className="mt-4 text-center text-sm text-gray-600">
                  This may take 30-60 seconds...
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
