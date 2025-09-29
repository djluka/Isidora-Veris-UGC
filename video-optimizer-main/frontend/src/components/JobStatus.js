import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  ArrowDownTrayIcon,
  TrashIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const API_BASE = process.env.REACT_APP_API_BASE || '';

const JobStatus = ({ job, onUpdate, onRemove }) => {
  const [isPolling, setIsPolling] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (isoString) => {
    try {
      return new Date(isoString).toLocaleTimeString();
    } catch {
      return 'Unknown time';
    }
  };

  const pollJobStatus = useCallback(async () => {
    if (!job.job_id) {
      console.log('No job ID, skipping poll');
      return;
    }

    console.log('Polling status for job:', job.job_id, 'current status:', job.status);

    try {
      const response = await axios.get(`${API_BASE}/status/${job.job_id}`);
      console.log('Status response:', response.data);
      onUpdate(response.data);
      
      if (response.data.status === 'completed') {
        console.log('Job completed, setting download URL');
        setDownloadUrl(`${API_BASE}/download/${job.job_id}`);
      }
    } catch (error) {
      console.error('Error polling job status:', error);
      if (error.response?.status === 404) {
        onUpdate({ status: 'failed', error: 'Job not found' });
      }
    }
  }, [job.job_id, job.status, onUpdate]);

  const handleDownload = async () => {
    if (!downloadUrl) {
      console.error('No download URL available');
      alert('Download not ready yet');
      return;
    }
    
    console.log('Starting download from:', downloadUrl);
    
    try {
      const response = await axios.get(downloadUrl, {
        responseType: 'blob',
        timeout: 60000, // 60 second timeout
      });
      
      console.log('Download response received, size:', response.data.size);
      
      if (response.data.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data], { 
        type: response.headers['content-type'] || 'video/mp4' 
      }));
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `optimized_${job.filename}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      console.log('Downloading as:', filename);
      
      link.setAttribute('download', filename);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log('Download initiated successfully');
    } catch (error) {
      console.error('Download error:', error);
      const errorMessage = error.response?.data ? 
        `Server error: ${error.response.status}` : 
        `Download failed: ${error.message}`;
      alert(errorMessage);
    }
  };

  const handleCleanup = async () => {
    try {
      await axios.delete(`${API_BASE}/cleanup/${job.job_id}`);
      onRemove();
    } catch (error) {
      console.error('Cleanup error:', error);
      // Still remove from UI even if cleanup failed
      onRemove();
    }
  };

  // Start polling when job is not in final state
  useEffect(() => {
    console.log('useEffect triggered - job status:', job.status, 'isPolling:', isPolling);
    
    if (job.status && !['completed', 'failed'].includes(job.status)) {
      if (!isPolling) {
        console.log('Starting polling for job:', job.job_id, 'status:', job.status);
        setIsPolling(true);
        const interval = setInterval(pollJobStatus, 2000); // Poll every 2 seconds
        
        return () => {
          console.log('Cleanup: Stopping polling for job:', job.job_id);
          clearInterval(interval);
          setIsPolling(false);
        };
      }
    } else if (['completed', 'failed'].includes(job.status) && isPolling) {
      console.log('Job completed/failed, stopping polling for:', job.job_id);
      setIsPolling(false);
    }
  }, [job.status, job.job_id, pollJobStatus]);

  const getStatusIcon = () => {
    switch (job.status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <CpuChipIcon className="h-5 w-5 text-blue-500 animate-pulse" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusText = () => {
    switch (job.status) {
      case 'uploaded':
        return 'Queued for processing';
      case 'processing':
        return 'Optimizing video...';
      case 'completed':
        return 'Optimization completed';
      case 'failed':
        return 'Processing failed';
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    switch (job.status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Job Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {job.filename}
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
              <span>{formatFileSize(job.size)}</span>
              <span>•</span>
              <span>Uploaded at {formatTime(job.uploadedAt)}</span>
              <span>•</span>
              <span>Format: {job.outputFormat === 'mp4' ? 'MP4 (H.264)' : 'Original'}</span>
              <span>•</span>
              <span>Job ID: {job.job_id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {job.status === 'completed' && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
              Download
            </button>
          )}
          <button
            onClick={handleCleanup}
            className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={clsx('font-medium', getStatusColor())}>
            {getStatusText()}
          </span>
          {job.progress !== undefined && job.status !== 'completed' && (
            <span className="text-gray-500">{job.progress}%</span>
          )}
        </div>

        {/* Progress Bar */}
        {job.progress !== undefined && job.status !== 'failed' && (
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className={clsx(
                "h-2 rounded-full transition-all duration-300",
                {
                  "bg-blue-600": job.status === 'processing',
                  "bg-green-600": job.status === 'completed',
                  "bg-yellow-600": job.status === 'uploaded'
                }
              )}
              style={{ width: `${job.progress || 0}%` }}
            />
          </div>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-800">{job.error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobStatus;
