export default function SliderSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="relative">
        {/* Outer ring */}
        <div className="w-20 h-20 border-8 border-gray-200 rounded-full"></div>
        {/* Spinning gradient ring */}
        <div className="absolute top-0 left-0 w-20 h-20 border-8 rounded-full border-transparent animate-spin"
          style={{
            borderImage: 'linear-gradient(45deg, #3B82F6, #10B981, #3B82F6) 1',
            maskImage: 'linear-gradient(transparent 50%, black 50%)',
            WebkitMaskImage: 'linear-gradient(transparent 50%, black 50%)'
          }}
        ></div>
      </div>
      <div className="mt-4 text-base text-gray-500 dark:text-gray-400 animate-pulse">
        Loading...
      </div>
    </div>
  );
}
