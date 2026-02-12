"use client";

import { useState, useEffect } from 'react';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import { UserRole, getRoleName, getStaffRoles } from '@/lib/permissions';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface StaffUser {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at: string;
}

export default function CreateStaffPage() {
  const { loading: accessLoading, authorized } = useRoleAccess({
    requiredPermission: 'users',
    requiredLevel: 'full',
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('csr');
  const [autoConfirm, setAutoConfirm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [staffMembers, setStaffMembers] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPassword, setResetPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (authorized) {
      fetchStaffMembers();
    }
  }, [authorized]);

  async function fetchStaffMembers() {
    try {
      console.log('Fetching staff with roles:', getStaffRoles());

      // Use API route to bypass RLS
      const response = await fetch('/api/admin/staff/list');
      const result = await response.json();

      console.log('Staff query result:', result);

      if (!response.ok) {
        console.error('Error fetching staff:', result.error);
        return;
      }

      console.log(`Found ${result.staff?.length || 0} staff members`);
      setStaffMembers(result.staff || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoadingStaff(false);
    }
  }

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 16; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          password,
          full_name: fullName.trim(),
          role,
          auto_confirm: autoConfirm,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setSuccess(`User created successfully! Email: ${email}`);

      // Refresh staff list immediately
      fetchStaffMembers();

      // Reset form after showing success
      setTimeout(() => {
        setEmail('');
        setPassword('');
        setFullName('');
        setRole('csr');
        setSuccess('');
      }, 2000);

    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');
    setResetSuccess('');

    try {
      const response = await fetch('/api/admin/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: resetEmail.toLowerCase().trim(),
          newPassword: resetPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setResetSuccess(`Password reset successfully for ${resetEmail}`);

      // Reset form after showing success
      setTimeout(() => {
        setResetEmail('');
        setResetPassword('');
        setResetSuccess('');
      }, 3000);

    } catch (err: any) {
      console.error('Error resetting password:', err);
      setResetError(err.message || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
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

  const staffRoles = getStaffRoles().filter(r => r !== 'admin');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/role-management"
          className="text-gray-600 hover:text-gray-900"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-[#552627]">Staff Management</h1>
          <p className="text-gray-600 mt-1">Create and manage staff members</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Create Staff Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create New Staff User</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{success}</span>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="staff@wingside.ng"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                >
                  {staffRoles.map(r => (
                    <option key={r} value={r}>
                      {getRoleName(r)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Temporary Password
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter a secure password"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              {/* Auto Confirm */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={autoConfirm}
                  onChange={(e) => setAutoConfirm(e.target.checked)}
                  className="mt-1"
                />
                <label htmlFor="autoConfirm" className="text-sm text-gray-700">
                  <span className="font-semibold">Auto-confirm email</span>
                  <p className="text-gray-500 mt-1">
                    User can log in immediately without email verification
                  </p>
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-[#552627] hover:bg-[#6b3132] disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating User...' : 'Create Staff User'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Reset Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Reset Staff Password</h2>
            <form onSubmit={handleResetPassword} className="space-y-4">
              {resetError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{resetError}</span>
                </div>
              )}

              {resetSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start gap-2">
                  <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{resetSuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Staff Email
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    placeholder="staff@wingside.ng"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="text"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F7C400]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="px-6 py-2 bg-[#F7C400] hover:bg-[#e5b800] disabled:bg-gray-400 text-black rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>

          {/* Staff List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Current Staff ({staffMembers.length})</h2>
            </div>

            {loadingStaff ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#552627] mx-auto mb-2"></div>
                <p className="text-gray-600">Loading staff...</p>
              </div>
            ) : staffMembers.length === 0 ? (
              <div className="p-8 text-center text-gray-600">
                No staff members found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {staffMembers.map((staff) => (
                      <tr key={staff.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {staff.full_name || 'No name'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {staff.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeColor(staff.role)}`}>
                            {getRoleName(staff.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(staff.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Create Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-3">Quick Staff Setup</h3>
            <p className="text-sm text-blue-800 mb-4">
              Create default staff accounts:
            </p>
            <div className="space-y-2 text-sm">
              <button
                onClick={() => {
                  setEmail('csr@wingside.ng');
                  setFullName('Customer Service Rep');
                  setRole('csr');
                  setPassword('Perekule500X');
                }}
                className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-blue-900 transition-colors"
              >
                Customer Service
              </button>
              <button
                onClick={() => {
                  setEmail('kitchen@wingside.ng');
                  setFullName('Kitchen Staff');
                  setRole('kitchen_staff');
                  setPassword('Perekule500X');
                }}
                className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-blue-900 transition-colors"
              >
                Kitchen Staff
              </button>
              <button
                onClick={() => {
                  setEmail('shiftmgr@wingside.ng');
                  setFullName('Shift Manager');
                  setRole('shift_manager');
                  setPassword('Perekule500X');
                }}
                className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-blue-900 transition-colors"
              >
                Shift Manager
              </button>
              <button
                onClick={() => {
                  setEmail('deliveries@wingside.ng');
                  setFullName('Delivery Staff');
                  setRole('delivery');
                  setPassword('Perekule500X');
                }}
                className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-blue-900 transition-colors"
              >
                Delivery
              </button>
              <button
                onClick={() => {
                  setEmail('sales@wingside.ng');
                  setFullName('Sales & Marketing');
                  setRole('sales_marketing');
                  setPassword('Perekule500X');
                }}
                className="w-full text-left px-3 py-2 bg-white hover:bg-blue-100 border border-blue-200 rounded text-blue-900 transition-colors"
              >
                Sales & Marketing
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-3">
              Click to auto-fill the form
            </p>
          </div>

          {/* Help */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 text-sm mb-2">Tips</h4>
            <ul className="text-xs text-yellow-800 space-y-1">
              <li>Use strong passwords or generate one</li>
              <li>Auto-confirm is recommended for staff</li>
              <li>Users can change password after first login</li>
              <li>Email must be unique in the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
