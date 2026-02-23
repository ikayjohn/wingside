// Shared loading component for all admin pages — keeps spinners consistent.
// Usage: <AdminLoader /> or <AdminLoader label="Loading orders..." />

interface AdminLoaderProps {
  label?: string;
}

export default function AdminLoader({ label = 'Loading...' }: AdminLoaderProps) {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-[#F7C400] border-t-transparent"></div>
        <p className="mt-3 text-sm text-gray-500 font-medium">{label}</p>
      </div>
    </div>
  );
}
