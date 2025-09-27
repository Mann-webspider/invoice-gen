// components/ProgressQueue.tsx
import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, X, ExternalLink } from 'lucide-react';

export interface ProcessItem {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  description?: string;
}

interface ProgressQueueProps {
  isOpen: boolean;
  onClose: () => void;
  onDashboardNavigate: () => void;
  processes: ProcessItem[];
  onProcessUpdate?: (processId: string, status: ProcessItem['status']) => void;
}

const ProgressQueue: React.FC<ProgressQueueProps> = ({
  isOpen,
  onClose,
  onDashboardNavigate,
  processes,
  onProcessUpdate
}) => {
  // const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentProcesses, setCurrentProcesses] = useState<ProcessItem[]>(processes);

  useEffect(() => {
  if (isOpen) {
    setCurrentProcesses(processes); // Sync external updates
  }
}, [processes, isOpen]);


  const allCompleted = currentProcesses.every(p => p.status === 'completed');
  const hasFailure = currentProcesses.some(p => p.status === 'failed');

  const handleDashboardClick = () => onDashboardNavigate();;
  const handleConfirmDashboard = () => {
    
    
  };

  const getStatusIcon = (status: ProcessItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'running':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: ProcessItem['status']) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'running': return 'Processing...';
      case 'failed': return 'Failed';
      default: return 'Pending';
    }
  };

  const getStatusColor = (status: ProcessItem['status']) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'running': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Processing Your Request</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={!allCompleted && !hasFailure}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {currentProcesses.map((process) => (
              <div
                key={process.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all duration-200 ${
                  process.status === 'running'
                    ? 'bg-blue-50 border-blue-200'
                    : process.status === 'completed'
                    ? 'bg-green-50 border-green-200'
                    : process.status === 'failed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-shrink-0 mt-0.5">{getStatusIcon(process.status)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{process.title}</h3>
                    <span className={`text-xs font-medium ${getStatusColor(process.status)}`}>
                      {getStatusText(process.status)}
                    </span>
                  </div>
                  {process.description && (
                    <p className="text-xs text-gray-500 mt-1">{process.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(allCompleted || hasFailure) && (
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex space-x-3">
                <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md ">
                  Done!
                </button>
                <button
                  onClick={handleDashboardClick}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md flex items-center justify-center space-x-2"
                >
                  <span>Go to Dashboard</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Navigate to Dashboard?</h3>
              <p className="text-sm text-gray-600 mb-6">Are you sure you want to go to the dashboard?</p>
              <div className="flex space-x-3">
                <button onClick={() => setShowConfirmDialog(false)} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                  Cancel
                </button>
                <button onClick={handleConfirmDashboard} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md">
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )} */}
    </>
  );
};

export default ProgressQueue;
