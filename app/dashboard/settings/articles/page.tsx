'use client';

import { motion } from 'framer-motion';

export default function ArticlesSettingsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Article Settings</h1>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-sm font-medium text-gray-700">Auto-publish articles</span>
            </label>
            <p className="text-sm text-gray-600 ml-6">Articles will be published automatically when ready</p>
          </div>
          
          <div>
            <label className="flex items-center gap-2 mb-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm font-medium text-gray-700">Require review before publishing</span>
            </label>
            <p className="text-sm text-gray-600 ml-6">Articles will be saved as drafts for your review</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Default Article Category</label>
            <input
              type="text"
              defaultValue="SEO"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}
