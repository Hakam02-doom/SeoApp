'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SettingsPage() {
  const pathname = usePathname();
  
  const settingsMenu = [
    { name: 'Project', path: '/dashboard/settings/project' },
    { name: 'Articles', path: '/dashboard/settings/articles' },
    { name: 'Integrations', path: '/dashboard/settings/integrations' },
    { name: 'Billing', path: '/dashboard/settings/billing' },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Settings</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {settingsMenu.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.path}
                className={`block p-6 rounded-xl border-2 transition-all ${
                  pathname === item.path
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="text-lg font-semibold text-gray-900">{item.name}</div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
