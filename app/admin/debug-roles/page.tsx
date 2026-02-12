"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStaffRoles, canAccessAdmin, UserRole, getRoleName } from '@/lib/permissions';

export default function DebugRolesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setCurrentUser({ user, profile });
      }

      // Get all users via API (to bypass RLS)
      const response = await fetch('/api/admin/staff/list');
      const result = await response.json();

      setAllUsers(result.staff || []);
    }

    loadData();
  }, []);

  const staffRoles = getStaffRoles();

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug: Roles & Permissions</h1>

      {/* Staff Roles Config */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Staff Roles from getStaffRoles()</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
          {JSON.stringify(staffRoles, null, 2)}
        </pre>
      </div>

      {/* Current User */}
      {currentUser && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current Logged-in User</h2>
          <div className="space-y-2 text-sm">
            <p><strong>Email:</strong> {currentUser.user.email}</p>
            <p><strong>Role in DB:</strong> {currentUser.profile?.role || 'NULL'}</p>
            <p><strong>Role Name:</strong> {getRoleName(currentUser.profile?.role)}</p>
            <p><strong>Can Access Admin:</strong> {canAccessAdmin(currentUser.profile?.role as UserRole) ? '✅ YES' : '❌ NO'}</p>
            <p><strong>Is in Staff Roles:</strong> {staffRoles.includes(currentUser.profile?.role) ? '✅ YES' : '❌ NO'}</p>
          </div>
          <details className="mt-4">
            <summary className="cursor-pointer text-blue-600">Full User Data</summary>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto mt-2">
              {JSON.stringify(currentUser, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* All Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">All Users in Database ({allUsers.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Role</th>
                <th className="px-4 py-2 text-left">Can Access Admin</th>
                <th className="px-4 py-2 text-left">In Staff Roles</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {user.role || 'NULL'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {canAccessAdmin(user.role as UserRole) ? '✅ YES' : '❌ NO'}
                  </td>
                  <td className="px-4 py-2">
                    {staffRoles.includes(user.role) ? '✅ YES' : '❌ NO'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
