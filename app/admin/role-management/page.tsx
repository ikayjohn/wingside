"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { UserRole, getRoleName, getStaffRoles, rolePermissions } from '@/lib/permissions';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
}

export default function RoleManagementPage() {
  const { loading: accessLoading, authorized } = useRoleAccess({
    requiredPermission: 'role_management',
    requiredLevel: 'full',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [selectedRoleInfo, setSelectedRoleInfo] = useState<UserRole | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (authorized) {
      fetchUsers();
    }
  }, [authorized]);

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, role, full_name, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateUserRole(userId: string, newRole: UserRole) {
    setUpdating(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) {
        console.error('Error updating role:', error);
        alert('Failed to update role');
        return;
      }

      // Update local state
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      alert('Role updated successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setUpdating(null);
    }
  }

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'shift_manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'csr':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'kitchen_staff':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'delivery':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sales_marketing':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (accessLoading || !authorized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#552627] mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#552627]">Role Management</h1>
          <p className="text-gray-600 mt-1">Manage user roles and permissions</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/create-staff"
            className="px-4 py-2 bg-[#F7C400] hover:bg-[#e5b800] text-gray-900 rounded-lg transition-colors font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Staff
          </Link>
          <Link
            href="/admin/role-management/permissions"
            className="px-4 py-2 bg-[#552627] text-white rounded-lg hover:bg-[#6b3132] transition-colors font-medium"
          >
            View Permissions
          </Link>
        </div>
      </div>

      {/* Role Permissions Quick Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Quick Reference: Role Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          {getStaffRoles().map(role => {
            const permissions = rolePermissions[role];
            const accessCount = Object.values(permissions).filter(p => p.level !== 'none').length;
            const fullAccessCount = Object.values(permissions).filter(p => p.level === 'full').length;

            return (
              <button
                key={role}
                onClick={() => setSelectedRoleInfo(selectedRoleInfo === role ? null : role)}
                className={`text-left p-3 rounded-lg border-2 transition-all ${
                  selectedRoleInfo === role
                    ? 'border-blue-500 bg-white shadow-md'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(role)}`}>
                    {getRoleName(role)}
                  </span>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${selectedRoleInfo === role ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="text-xs text-gray-600">
                  <div>{accessCount} features accessible</div>
                  <div>{fullAccessCount} with full control</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Expanded Role Details */}
        {selectedRoleInfo && (
          <div className="mt-4 p-4 bg-white border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-3">{getRoleName(selectedRoleInfo)} - Detailed Permissions</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.entries(rolePermissions[selectedRoleInfo])
                .filter(([_, perm]) => perm.level !== 'none')
                .map(([category, perm]) => (
                  <div key={category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="font-medium text-gray-700 capitalize">
                      {category.replace(/_/g, ' ')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      perm.level === 'full' ? 'bg-green-100 text-green-800' :
                      perm.level === 'edit' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {perm.level}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">All Users ({users.length})</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#552627] mx-auto mb-2"></div>
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-gray-600">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Current Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Change Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-[#552627] rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-white">
                            {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.full_name || 'No name'}
                          </div>
                          <div className="text-xs text-gray-500">{user.id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleName(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onChange={(e) => updateUserRole(user.id, e.target.value as UserRole)}
                        disabled={updating === user.id}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                        <option value="shift_manager">Shift Manager</option>
                        <option value="csr">Customer Service</option>
                        <option value="kitchen_staff">Kitchen Staff</option>
                        <option value="delivery">Delivery</option>
                        <option value="sales_marketing">Sales & Marketing</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Role Management Guidelines:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-700">
              <li>Changes take effect immediately after the user's next page load</li>
              <li>Only Admins can manage user roles</li>
              <li>Be careful when changing roles - users will lose access to unauthorized sections</li>
              <li>Staff email addresses: admin@wingside.ng, csr@wingside.ng, kitchen@wingside.ng, shiftmgr@wingside.ng, deliveries@wingside.ng, sales@wingside.ng</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
