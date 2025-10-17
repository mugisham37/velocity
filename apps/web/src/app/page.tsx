'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { AppLayout, Sidebar, Topbar, Workspace } from '@/components/layout';
import MobileNavigation from '@/components/layout/MobileNavigation';

function DashboardContent() {
  return (
    <AppLayout
      sidebar={<Sidebar />}
      topbar={<Topbar />}
    >
      <Workspace />
      <MobileNavigation />
    </AppLayout>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
