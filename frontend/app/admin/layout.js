'use client'
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '../adminhome/layout';

const AdminRoutesLayout = ({ children }) => {
  const router = useRouter();

  // This layout simply reuses the AdminLayout from adminhome
  // This ensures consistent navigation across all admin pages
  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
};

export default AdminRoutesLayout;