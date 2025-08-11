import { Button } from "@/components/ui/button"; // Adjust import path as needed

export const LoadingButton = ({ 
  onClick, 
  isGenerating = false, 
  disabled = false,
  className = "",
  children,
  loadingText = "Submitting...",
  ...props 
}) => {
  return (
    <Button 
      onClick={onClick}
      disabled={disabled || isGenerating}
      className={`
        
        py-2 px-3 border-green-300 bg-green-600  
        hover:text-green-50 
        transition-all duration-300 ease-in-out
        ${isGenerating 
          ? 'opacity-50 cursor-not-allowed bg-gray-400 border-gray-400' 
          : 'transform hover:scale-105 active:scale-95'
        }
        ${className}
      `}
      {...props}
    >
      {isGenerating ? (
        <div className="flex items-center gap-2">
          <svg 
            className="animate-spin h-4 w-4 text-white" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {loadingText}
        </div>
      ) : (
        children || 'Generate'
      )}
    </Button>
  );
};

export default LoadingButton    ;
