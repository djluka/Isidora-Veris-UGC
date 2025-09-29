import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { 
  CloudArrowUpIcon, 
  DocumentIcon, 
  XMarkIcon,
  ExclamationCircleIcon 
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

const API_BASE = process.env.REACT_APP_API_BASE || '';

const VideoUploader = ({ onJobCreated }) => {
  const [uploadState, setUploadState] = useState({
    uploading: false,
    error: null,
    progress: 0
  });
  const [outputFormat, setOutputFormat] = useState('original');

  const handleUpload = useCallback(async (file) => {
    setUploadState({ uploading: true, error: null, progress: 0 });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('output_format', outputFormat);

      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadState(prev => ({ ...prev, progress }));
        },
      });

      if (response.data && response.data.job_id) {
        onJobCreated({
          job_id: response.data.job_id,
          filename: file.name,
          size: file.size,
          status: 'uploaded',
          progress: 0,
          uploadedAt: new Date().toISOString(),
          outputFormat: outputFormat
        });
        
        setUploadState({ uploading: false, error: null, progress: 0 });
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Upload failed';
      setUploadState({ uploading: false, error: errorMessage, progress: 0 });
    }
  }, [onJobCreated, outputFormat]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0]?.message || 'File not accepted';
      setUploadState({ uploading: false, error, progress: 0 });
      return;
    }

    if (acceptedFiles.length > 0) {
      handleUpload(acceptedFiles[0]);
    }
  }, [handleUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv', '.webm']
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
    disabled: uploadState.uploading
  });

  const clearError = () => {
    setUploadState(prev => ({ ...prev, error: null }));
  };

  return (
    <div className="space-y-4">
      {/* Format Selection */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-blue-900 mb-3">
          Output Format
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="original"
              checked={outputFormat === 'original'}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mr-3 text-blue-600 focus:ring-blue-500"
              disabled={uploadState.uploading}
            />
            <span className="text-sm text-blue-800">
              <strong>Original Format</strong> - Keep the same format, aggressive compression
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="format"
              value="mp4"
              checked={outputFormat === 'mp4'}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="mr-3 text-blue-600 focus:ring-blue-500"
              disabled={uploadState.uploading}
            />
            <span className="text-sm text-blue-800">
              <strong>MP4 with H.264</strong> - Universal web format, small size, excellent compatibility
            </span>
          </label>
        </div>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={clsx(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          {
            "border-blue-300 bg-blue-50": isDragActive && !isDragReject,
            "border-red-300 bg-red-50": isDragReject,
            "border-gray-300 hover:border-gray-400 hover:bg-gray-50": !isDragActive && !uploadState.uploading,
            "border-gray-200 bg-gray-100 cursor-not-allowed": uploadState.uploading
          }
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {uploadState.uploading ? (
            <>
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">Uploading...</p>
                <div className="mt-2 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadState.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-sm text-gray-600">{uploadState.progress}%</p>
              </div>
            </>
          ) : (
            <>
              <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                {isDragActive ? (
                  isDragReject ? (
                    <p className="text-lg font-medium text-red-900">File type not supported</p>
                  ) : (
                    <p className="text-lg font-medium text-blue-900">Drop your video file here</p>
                  )
                ) : (
                  <>
                    <p className="text-lg font-medium text-gray-900">
                      Drop your video file here, or click to select
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Supports MP4, AVI, MOV, MKV, WMV, FLV, WebM (max 500MB)
                    </p>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {uploadState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-800">{uploadState.error}</p>
            </div>
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  onClick={clearError}
                  className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUploader;
