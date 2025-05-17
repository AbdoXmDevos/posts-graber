"use client"

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Toast notification component
export const Toast = ({
  message,
  type = 'success',
  onClose,
  actionLink = null,
  actionText = null
}: {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  actionLink?: string | null;
  actionText?: string | null;
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-green-500 bg-gray-900';
      case 'error':
        return 'border-l-4 border-red-500 bg-gray-900';
      case 'info':
      default:
        return 'border-l-4 border-blue-500 bg-gray-900';
    }
  };

  const getIconStyles = () => {
    switch (type) {
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      case 'info':
      default:
        return 'text-blue-500';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 ${getToastStyles()} text-white p-4 rounded shadow-lg z-50 flex items-center border border-gray-800 animate-slideIn`}>
      <div className={`mr-3 ${getIconStyles()}`}>
        {type === 'success' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {type === 'error' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {type === 'info' && (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </div>
      <div className="mr-3 text-gray-200">{message}</div>
      {actionLink && actionText && (
        <Link
          href={actionLink}
          className="px-3 py-1 bg-gray-800 rounded text-purple-400 text-sm hover:bg-gray-700 transition-colors"
        >
          {actionText}
        </Link>
      )}
      <button
        onClick={onClose}
        className="ml-4 text-gray-400 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
};

// Interface for Apify usage data
interface ApifyUsage {
  monthlyUsageUsd: number;
  maxMonthlyUsageUsd: number;
  isLoading: boolean;
  error: string | null;
}

// Main layout component
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [apifyUsage, setApifyUsage] = useState<ApifyUsage>({
    monthlyUsageUsd: 0,
    maxMonthlyUsageUsd: 5, // Default value
    isLoading: true,
    error: null
  });
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    actionLink?: string;
    actionText?: string;
  } | null>(null);

  // Function to show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success', actionLink?: string, actionText?: string) => {
    setToast({ message, type, actionLink, actionText });
  };

  // Fetch Apify usage data
  useEffect(() => {
    const fetchApifyUsage = async () => {
      try {
        // Use the mock API endpoint for testing
        // In production, you would use the real Apify API
        // const response = await fetch('https://api.apify.com/v2/users/me/limits', {
        //   headers: {
        //     'Authorization': `Bearer ${process.env.NEXT_PUBLIC_APIFY_TOKEN || 'apify_api_6eaZXSSAHfI4OQB8BW838e4lkqb4154eUPTk'}`
        //   }
        // });

        // Using mock API for testing
        const response = await fetch('/api/apify-mock');

        if (!response.ok) {
          throw new Error(`Failed to fetch Apify usage: ${response.status}`);
        }

        const data = await response.json();

        setApifyUsage({
          monthlyUsageUsd: data.data.current.monthlyUsageUsd,
          maxMonthlyUsageUsd: data.data.limits.maxMonthlyUsageUsd,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error fetching Apify usage:', error);
        setApifyUsage(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to fetch usage data'
        }));
      }
    };

    fetchApifyUsage();
  }, []);

  // Make showToast available globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showToast = showToast;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).showToast;
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar - fixed on left side */}
      <aside className="bg-black border-r border-gray-800 w-64 fixed h-full z-20">
        <div className="p-4 border-b border-gray-800 flex items-center">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mr-3">
            <span className="text-white font-bold">IG</span>
          </div>
          <h1 className="text-xl font-bold text-white">Instagram JSON</h1>
        </div>

        <div className="p-4">
          <nav>
            <div className="text-gray-400 uppercase text-xs font-semibold mb-3 ml-2">Menu</div>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/"
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    pathname === '/'
                      ? 'bg-gradient-to-r from-purple-900/40 to-transparent border-l-2 border-purple-500 text-purple-400'
                      : 'hover:bg-gray-900 text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generator
                </Link>
              </li>
              <li>
                <Link
                  href="/list"
                  className={`flex items-center p-2 rounded-md transition-colors ${
                    pathname === '/list'
                      ? 'bg-gradient-to-r from-purple-900/40 to-transparent border-l-2 border-purple-500 text-purple-400'
                      : 'hover:bg-gray-900 text-gray-300'
                  }`}
                >
                  <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Saved Files
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 ml-64 flex flex-col">
        {/* Top Bar */}
        <header className="bg-gray-900 border-b border-gray-800 py-3 px-6 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center">
            <button
              className="md:hidden mr-3 text-gray-400 hover:text-white"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
          </div>
          <div className="flex items-center">
            <div className="bg-gray-800 text-gray-300 px-3 py-1 rounded-md border border-gray-700 flex items-center">
              <span className="mr-2">Quota:</span>
              <div className="bg-gray-700 h-2 w-24 rounded-full overflow-hidden">
                {apifyUsage.isLoading ? (
                  <div className="bg-gray-600 h-full animate-pulse"></div>
                ) : (
                  <div
                    className={`${
                      apifyUsage.monthlyUsageUsd / apifyUsage.maxMonthlyUsageUsd > 0.8
                        ? 'bg-gradient-to-r from-yellow-500 to-red-500'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500'
                    } h-full`}
                    style={{
                      width: `${Math.min(100, (apifyUsage.monthlyUsageUsd / apifyUsage.maxMonthlyUsageUsd) * 100)}%`
                    }}
                  ></div>
                )}
              </div>
              <span className="ml-2 font-mono text-xs">
                {apifyUsage.isLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : apifyUsage.error ? (
                  <span className="text-red-400">Error</span>
                ) : (
                  `${apifyUsage.monthlyUsageUsd.toFixed(4)}$/${apifyUsage.maxMonthlyUsageUsd}$`
                )}
              </span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 bg-gray-950">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          actionLink={toast.actionLink}
          actionText={toast.actionText}
        />
      )}
    </div>
  );
}
