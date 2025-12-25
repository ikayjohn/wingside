/**
 * Loading Skeleton Components
 * Provides visual placeholders while content loads
 * Improves perceived performance
 */

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
        <div className="h-3 bg-gray-200 rounded animate-pulse mb-4 w-1/2" />
        <div className="flex gap-2">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-20" />
          <div className="h-8 bg-gray-200 rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

export function FlavorCardSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-8 items-center">
      <div className="order-2 md:order-1">
        <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-1/2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-1 w-3/4" />
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-1/2" />
        <div className="h-10 bg-gray-200 rounded animate-pulse w-32" />
      </div>
      <div className="order-1 md:order-2">
        <div className="h-[200px] md:h-[300px] lg:h-[400px] bg-gray-200 rounded-lg animate-pulse w-full" />
      </div>
    </div>
  );
}

export function OrderItemSkeleton() {
  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded animate-pulse" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-3/4" />
          <div className="h-3 bg-gray-200 rounded animate-pulse mb-1 w-1/2" />
          <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="h-10 bg-gray-200 rounded animate-pulse" />

      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
      ))}
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="h-4 bg-gray-200 rounded animate-pulse mb-2 w-1/3" />
      <div className="h-8 bg-gray-200 rounded animate-pulse mb-2 w-1/2" />
      <div className="h-3 bg-gray-200 rounded animate-pulse w-1/4" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-12 bg-gray-200 rounded animate-pulse w-1/3" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
        <StatsCardSkeleton />
      </div>
      <TableSkeleton rows={8} />
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <OrderItemSkeleton key={i} />
      ))}
      <div className="border-t border-gray-200 pt-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-2 w-1/4" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-1/3" />
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="h-[60vh] md:h-[70vh] bg-gray-200 animate-pulse flex items-center justify-center">
      <div className="text-center">
        <div className="h-12 bg-gray-300 rounded animate-pulse mb-4 w-64 mx-auto" />
        <div className="h-6 bg-gray-300 rounded animate-pulse w-48 mx-auto" />
      </div>
    </div>
  );
}

/**
 * Loading Spinner Component
 */
export function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizes[size]} border-2 border-[#552627] border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
}

/**
 * Full Page Loader
 */
export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </div>
  );
}
