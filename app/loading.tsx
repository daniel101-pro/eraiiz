export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 bg-green-100 rounded-full animate-pulse opacity-50"></div>
        </div>
        <p className="text-gray-600 text-lg font-medium animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
} 