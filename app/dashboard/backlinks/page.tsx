'use client';

import { motion } from 'framer-motion';

export default function BacklinksPage() {
  const stats = [
    { label: 'Total backlinks', value: '24', change: '+167%', trend: 'up', monthly: '+15 this month' },
    { label: 'Unique sources', value: '17', change: '+89%', trend: 'up', monthly: '+8 this month' },
  ];

  const backlinks = [
    { date: 'Sep 30, 2025', from: "O'Reilly", to: '20 Content Calendar Examples You Can Copy + Free...', status: 'Published' },
    { date: 'Sep 30, 2025', from: 'Waters Corporation', to: 'Link Building for Local SEO - 15 Strategies That Rank', status: 'Published' },
    { date: 'Sep 30, 2025', from: 'Kunde Family Winery', to: 'How to Master Google Business Profile Optimization in 2025', status: 'Published' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Backlinks</h1>
        <p className="text-gray-600 mb-6">
          Automatically exchange backlinks with relevant websites to boost your SEO.
        </p>

        {/* Network Banner */}
        <div className="bg-purple-50 border border-pink-200 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🔗</span>
              </div>
              <div>
                <div className="font-bold text-gray-900 mb-1">You've joined the Backlink Network</div>
                <div className="text-green-600 text-sm">Backlink exchange is enabled.</div>
              </div>
            </div>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">
              Leave network
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6"
            >
              <div className="text-sm text-gray-600 mb-2">{stat.label}</div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="flex items-center gap-2 text-green-600 font-semibold mb-1">
                <span>↑</span>
                <span>{stat.change}</span>
              </div>
              <div className="text-sm text-gray-600">{stat.monthly}</div>
            </motion.div>
          ))}
        </div>

        {/* Growth Chart Placeholder */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Backlink growth</h2>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            Chart visualization placeholder
          </div>
        </div>

        {/* Received Backlinks Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Received backlinks</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">From</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {backlinks.map((link, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-700">{link.date}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-semibold">
                        {link.from.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-900">{link.from}</span>
                      <span className="text-gray-400">→</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{link.to}</span>
                      <span className="text-gray-400">→</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                      {link.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
