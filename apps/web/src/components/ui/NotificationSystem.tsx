'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const colorMap = {
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: 'text-green-400',
    title: 'text-green-800',
    message: 'text-green-700',
    button: 'text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    icon: 'text-red-400',
    title: 'text-red-800',
    message: 'text-red-700',
    button: 'text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50',
  },
  warning: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    icon: 'text-yellow-400',
    title: 'text-yellow-800',
    message: 'text-yellow-700',
    button: 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    icon: 'text-blue-400',
    title: 'text-blue-800',
    message: 'text-blue-700',
    button: 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50',
  },
};

export function NotificationSystem() {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
      <AnimatePresence>
        {notifications.slice(0, 5).map((notification) => {
          const Icon = iconMap[notification.type];
          const colors = colorMap[notification.type];

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 300, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 300, scale: 0.8 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`${colors.bg} ${colors.border} border rounded-lg p-4 shadow-lg`}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <div className="ml-3 flex-1">
                  <h3 className={`text-sm font-medium ${colors.title}`}>
                    {notification.title}
                  </h3>
                  {notification.message && (
                    <div className={`mt-2 text-sm ${colors.message}`}>
                      <p>{notification.message}</p>
                    </div>
                  )}
                </div>
                <div className="ml-auto pl-3">
                  <div className="-mx-1.5 -my-1.5">
                    <button
                      type="button"
                      onClick={() => removeNotification(notification.id)}
                      className={`inline-flex rounded-md p-1.5 ${colors.button} focus:outline-none focus:ring-2 focus:ring-offset-2`}
                    >
                      <span className="sr-only">Dismiss</span>
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}