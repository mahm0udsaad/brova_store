// A placeholder component to show while product data is being generated.
// This provides a better user experience than a generic spinner.

export function ProductSkeleton({ count = 1 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-border rounded-lg p-4 animate-pulse">
          <div className="w-full h-48 bg-muted rounded-md mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
