export default function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-12 h-12 relative">
        <div className="animate-pulse absolute inset-0 rounded-full bg-blue-500 opacity-75"></div>
        <div className="animate-spin absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    </div>
  );
}
