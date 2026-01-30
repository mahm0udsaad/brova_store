export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-lg animate-pulse">
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mx-auto mb-3" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
        </div>
        <div className="space-y-4 mb-8">
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
          <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>
    </div>
  )
}
