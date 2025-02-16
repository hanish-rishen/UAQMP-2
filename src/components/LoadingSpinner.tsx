export default function LoadingSpinner() {
  return (
    <div className="flex space-x-2 animate-pulse">
      <div className="w-3 h-3 bg-blue-500 rounded-full animation-delay-150"></div>
      <div className="w-3 h-3 bg-blue-500 rounded-full animation-delay-300"></div>
      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
    </div>
  );
}
