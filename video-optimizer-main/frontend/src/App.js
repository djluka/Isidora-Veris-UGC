import React, { useState, useCallback } from 'react';
import VideoUploader from './components/VideoUploader';
import JobStatus from './components/JobStatus';
import { CloudArrowUpIcon, CpuChipIcon } from '@heroicons/react/24/outline';

function App() {
  const [jobs, setJobs] = useState([]);

  const handleJobCreated = useCallback((jobData) => {
    setJobs(prevJobs => [jobData, ...prevJobs]);
  }, []);

  const handleJobUpdate = useCallback((jobId, updateData) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.job_id === jobId ? { ...job, ...updateData } : job
      )
    );
  }, []);

  const handleJobRemove = useCallback((jobId) => {
    setJobs(prevJobs => prevJobs.filter(job => job.job_id !== jobId));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CpuChipIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Optimizer</h1>
              <p className="text-gray-600">Optimize your videos with lossless compression for web</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <CloudArrowUpIcon className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Upload Video</h2>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Upload your video files to optimize them for web delivery with lossless compression
            </p>
          </div>
          <div className="p-6">
            <VideoUploader onJobCreated={handleJobCreated} />
          </div>
        </div>

        {/* Jobs Section */}
        {jobs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Processing Jobs</h2>
              <p className="mt-1 text-sm text-gray-600">
                Track the progress of your video optimization jobs
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {jobs.map((job) => (
                <JobStatus
                  key={job.job_id}
                  job={job}
                  onUpdate={(updateData) => handleJobUpdate(job.job_id, updateData)}
                  onRemove={() => handleJobRemove(job.job_id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <div className="flex items-start space-x-2">
              <span className="font-medium">1.</span>
              <span>Upload your video file using the drag & drop area above</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">2.</span>
              <span>Our system will optimize your video using FFmpeg with lossless compression settings</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="font-medium">3.</span>
              <span>Download the optimized video once processing is complete</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-100 rounded-md">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Videos are optimized with H.264 codec using CRF 18 (visually lossless) 
              and web-optimized settings for fast streaming. Files are automatically cleaned up after 1 hour.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
