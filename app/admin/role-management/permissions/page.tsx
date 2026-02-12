"use client";

import { useState } from 'react';
import { useRoleAccess } from '@/lib/hooks/useRoleAccess';
import {
  UserRole,
  getRoleName,
  getStaffRoles,
  rolePermissions,
  PermissionLevel,
  PermissionCategory,
} from '@/lib/permissions';
import Link from 'next/link';

export default function PermissionsEditorPage() {
  const { loading: accessLoading, authorized } = useRoleAccess({
    requiredPermission: 'role_management',
    requiredLevel: 'full',
  });

  const [selectedRole, setSelectedRole] = useState<UserRole>('csr');
  const [viewMode, setViewMode] = useState<'matrix' | 'list'>('matrix');

  const staffRoles = getStaffRoles();

  // Get all permission categories
  const allCategories = Object.keys(rolePermissions.super_admin) as PermissionCategory[];

  const getLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case 'full':
        return 'bg-green-500 text-white';
      case 'edit':
        return 'bg-blue-500 text-white';
      case 'view':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-200 text-gray-400';
    }
  };

  const getLevelIcon = (level: PermissionLevel) => {
    switch (level) {
      case 'full':
        return '✓✓✓';
      case 'edit':
        return '✓✓';
      case 'view':
        return '✓';
      default:
        return '✗';
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/role-management"
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-3xl font-bold text-[#552627]">Permissions Matrix</h1>
          </div>
          <p className="text-gray-600">View and understand role-based access control</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('matrix')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'matrix'
                ? 'bg-[#552627] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Matrix View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-[#552627] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-900 mb-3">Permission Levels:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded ${getLevelColor('none')} font-medium`}>
              {getLevelIcon('none')} None
            </span>
            <span className="text-gray-600">No access</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded ${getLevelColor('view')} font-medium`}>
              {getLevelIcon('view')} View
            </span>
            <span className="text-gray-600">Read only</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded ${getLevelColor('edit')} font-medium`}>
              {getLevelIcon('edit')} Edit
            </span>
            <span className="text-gray-600">View & modify</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded ${getLevelColor('full')} font-medium`}>
              {getLevelIcon('full')} Full
            </span>
            <span className="text-gray-600">Complete control</span>
          </div>
        </div>
      </div>

      {viewMode === 'matrix' ? (
        /* Matrix View */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Feature
                  </th>
                  {staffRoles.map(role => (
                    <th
                      key={role}
                      className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider"
                    >
                      <div className="whitespace-nowrap">{getRoleName(role)}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {allCategories.map(category => (
                  <tr key={category} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900 sticky left-0 bg-white z-10 whitespace-nowrap">
                      {category.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </td>
                    {staffRoles.map(role => {
                      const permission = rolePermissions[role][category];
                      const level = permission?.level || 'none';
                      return (
                        <td key={`${role}-${category}`} className="px-4 py-3 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded text-xs font-medium ${getLevelColor(level)}`}
                            title={permission?.description || level}
                          >
                            {getLevelIcon(level)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* List View */
        <div>
          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Role to View:
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as UserRole)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#F7C400] w-full md:w-auto"
            >
              {staffRoles.map(role => (
                <option key={role} value={role}>
                  {getRoleName(role)}
                </option>
              ))}
            </select>
          </div>

          {/* Permissions List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCategories.map(category => {
              const permission = rolePermissions[selectedRole][category];
              const level = permission?.level || 'none';

              if (level === 'none') return null;

              return (
                <div
                  key={category}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {category.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(level)}`}>
                      {level}
                    </span>
                  </div>
                  {permission?.description && (
                    <p className="text-xs text-gray-600">{permission.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          How to Edit Permissions
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>To modify role permissions, edit the file: <code className="bg-blue-100 px-2 py-1 rounded font-mono text-xs">lib/permissions.ts</code></p>
          <p className="font-medium">Steps:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2 text-blue-700">
            <li>Open <code className="bg-blue-100 px-1 rounded font-mono text-xs">lib/permissions.ts</code></li>
            <li>Find the <code className="bg-blue-100 px-1 rounded font-mono text-xs">rolePermissions</code> object</li>
            <li>Locate the role you want to modify (e.g., <code className="bg-blue-100 px-1 rounded font-mono text-xs">csr</code>)</li>
            <li>Change the permission level: <code className="bg-blue-100 px-1 rounded font-mono text-xs">'none'</code>, <code className="bg-blue-100 px-1 rounded font-mono text-xs">'view'</code>, <code className="bg-blue-100 px-1 rounded font-mono text-xs">'edit'</code>, or <code className="bg-blue-100 px-1 rounded font-mono text-xs">'full'</code></li>
            <li>Save the file - changes take effect immediately</li>
          </ol>
          <p className="mt-4 text-xs text-blue-600">
            💡 Tip: The permission system is centralized, so you only need to edit one file to control access across the entire admin panel.
          </p>
        </div>
      </div>
    </div>
  );
}
