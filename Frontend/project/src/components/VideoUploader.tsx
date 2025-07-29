import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import {
  CloudArrowUpIcon,
  VideoCameraIcon,
  XMarkIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { ProgressBar } from './ui/ProgressBar';

interface VideoUploaderProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUpload,
  isUploading = false,
  uploadProgress = 0,
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploadedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);
        onUpload(file);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv'],
    },
    maxFiles: 1,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const removeFile = () => {
    setUploadedFile(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upload Interview Video
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload your interview recording to get AI-powered feedback and analysis
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!uploadedFile ? (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500'
            }`}
          >
            <input {...getInputProps()} />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center"
            >
              <CloudArrowUpIcon className="w-10 h-10 text-white" />
            </motion.div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Drop your video here
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              or <span className="text-purple-600 hover:text-purple-700">browse</span> to choose a file
            </p>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Supports MP4, MOV, AVI, MKV • Max 500MB
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="uploaded"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center">
                <VideoCameraIcon className="w-8 h-8 text-purple-600 mr-3" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {uploadedFile.name}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(uploadedFile.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {isUploading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                ) : (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                )}
                <button
                  onClick={removeFile}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {preview && (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={preview}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {isUploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar value={uploadProgress} color="primary" />
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={removeFile} disabled={isUploading}>
                Remove File
              </Button>
              <Button
                variant="primary"
                loading={isUploading}
                disabled={isUploading}
              >
                {isUploading ? 'Processing...' : 'Start Analysis'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};