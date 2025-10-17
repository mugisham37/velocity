'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, checkSession } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const validateAccess = async () => {
      setIsChecking(true);

      // Check if user is authenticated
      if (!isAuthenticated || !user) {
        router.push('/login');
        return;
      }

      // Verify session is still valid
      const sessionValid = await checkSession();
      if (!sessionValid) {
        router.push('/login');
        return;
      }

      // Check role-based access if required
      if (requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role =>
          user.roles.includes(role)
        );

        if (!hasRequiredRole) {
          setHasAccess(false);
          setIsChecking(false);
          return;
        }
      }

      setHasAccess(true);
      setIsChecking(false);
    };

    validateAccess();
  }, [isAuthenticated, user, requiredRoles, router, checkSession]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have required roles
  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Access Denied</h2>
          <p className="mt-2 text-gray-600">
            You don&apos;t have permission to access this page.
          </p>
          {requiredRoles.length > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Required roles: {requiredRoles.join(', ')}
            </p>
          )}
          <button
            onClick={() => router.back()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}