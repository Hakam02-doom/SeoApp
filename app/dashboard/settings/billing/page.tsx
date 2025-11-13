'use client';

import { motion } from 'framer-motion';

export default function BillingSettingsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Billing Settings</h1>
        
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-900">RankYak Pro Plan</div>
                  <div className="text-sm text-gray-600">$99/month</div>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Manage Plan
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                    <span className="text-blue-600 font-bold">V</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Visa ending in 4242</div>
                    <div className="text-sm text-gray-600">Expires 12/25</div>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700">Update</button>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">November 2025</div>
                  <div className="text-sm text-gray-600">Pro Plan</div>
                </div>
                <div className="text-gray-900 font-medium">$99.00</div>
              </div>
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">October 2025</div>
                  <div className="text-sm text-gray-600">Pro Plan</div>
                </div>
                <div className="text-gray-900 font-medium">$99.00</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
