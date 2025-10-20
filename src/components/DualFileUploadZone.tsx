import React, { useState, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Archive, FileSpreadsheet, CheckCircle } from 'lucide-react';

interface DualFileUploadZoneProps {
  primaryFile: File | null;
  secondaryFile: File | null;
  onPrimaryFileSelect: (file: File) => void;
  onSecondaryFileSelect: (file: File) => void;
  onPrimaryFileClear: () => void;
  onSecondaryFileClear: () => void;
  primaryLabel: string;
  secondaryLabel: string;
  primaryAcceptedFormats: string;
  secondaryAcceptedFormats: string;
  primaryIcon?: React.ReactNode;
  secondaryIcon?: React.ReactNode;
}

export default function DualFileUploadZone({
  primaryFile,
  secondaryFile,
  onPrimaryFileSelect,
  onSecondaryFileSelect,
  onPrimaryFileClear,
  onSecondaryFileClear,
  primaryLabel,
  secondaryLabel,
  primaryAcceptedFormats,
  secondaryAcceptedFormats,
  primaryIcon,
  secondaryIcon
}: DualFileUploadZoneProps) {
  const [primaryDragging, setPrimaryDragging] = useState(false);
  const [secondaryDragging, setSecondaryDragging] = useState(false);
  const [primaryError, setPrimaryError] = useState('');
  const [secondaryError, setSecondaryError] = useState('');
  const primaryInputRef = useRef<HTMLInputElement>(null);
  const secondaryInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File, acceptedFormats: string, setError: (error: string) => void): boolean => {
    const maxSize = 50 * 1024 * 1024;
    const allowedExtensions = acceptedFormats.split(',').map(f => f.trim());
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      return false;
    }

    if (!allowedExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Accepted formats: ${acceptedFormats}`);
      return false;
    }

    setError('');
    return true;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const renderFileDisplay = (
    file: File | null,
    onClear: () => void,
    icon: React.ReactNode,
    label: string
  ) => {
    if (!file) return null;

    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
              <p className="font-semibold text-gray-900 text-sm mb-1 truncate">
                {file.name}
              </p>
              <p className="text-xs text-gray-600 mb-2">
                {formatFileSize(file.size)}
              </p>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-700 font-medium">Ready</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClear}
            className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>
    );
  };

  const renderUploadZone = (
    isDragging: boolean,
    onDragOver: (e: React.DragEvent) => void,
    onDragLeave: (e: React.DragEvent) => void,
    onDrop: (e: React.DragEvent) => void,
    onClick: () => void,
    inputRef: React.RefObject<HTMLInputElement>,
    acceptedFormats: string,
    onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void,
    icon: React.ReactNode,
    label: string,
    error: string
  ) => {
    return (
      <div>
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onClick}
          className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-50 scale-105'
              : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={acceptedFormats}
            onChange={onFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center space-y-3">
            <div
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-200 ${
                isDragging
                  ? 'bg-blue-500 scale-110'
                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
              }`}
            >
              {icon}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {label}
              </p>
              <p className="text-xs text-gray-600 mb-1">
                {isDragging ? 'Drop your file here' : 'Drag and drop or click to browse'}
              </p>
              <p className="text-xs text-gray-500">
                {acceptedFormats.split(',').join(', ')}
              </p>
              <p className="text-xs text-gray-400 mt-1">Max 50MB</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-red-800">{error}</p>
          </div>
        )}
      </div>
    );
  };

  const handlePrimaryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setPrimaryDragging(true);
  };

  const handlePrimaryDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setPrimaryDragging(false);
  };

  const handlePrimaryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setPrimaryDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file, primaryAcceptedFormats, setPrimaryError)) {
      onPrimaryFileSelect(file);
    }
  };

  const handlePrimaryFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file, primaryAcceptedFormats, setPrimaryError)) {
      onPrimaryFileSelect(file);
    }
  };

  const handleSecondaryDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setSecondaryDragging(true);
  };

  const handleSecondaryDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setSecondaryDragging(false);
  };

  const handleSecondaryDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setSecondaryDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && validateFile(file, secondaryAcceptedFormats, setSecondaryError)) {
      onSecondaryFileSelect(file);
    }
  };

  const handleSecondaryFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file, secondaryAcceptedFormats, setSecondaryError)) {
      onSecondaryFileSelect(file);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          {primaryFile ? (
            renderFileDisplay(
              primaryFile,
              onPrimaryFileClear,
              primaryIcon || <Archive className="h-6 w-6 text-white" />,
              primaryLabel
            )
          ) : (
            renderUploadZone(
              primaryDragging,
              handlePrimaryDragOver,
              handlePrimaryDragLeave,
              handlePrimaryDrop,
              () => primaryInputRef.current?.click(),
              primaryInputRef,
              primaryAcceptedFormats,
              handlePrimaryFileInput,
              primaryIcon || <Archive className="h-6 w-6 text-white" />,
              primaryLabel,
              primaryError
            )
          )}
        </div>

        <div>
          {secondaryFile ? (
            renderFileDisplay(
              secondaryFile,
              onSecondaryFileClear,
              secondaryIcon || <FileSpreadsheet className="h-6 w-6 text-white" />,
              secondaryLabel
            )
          ) : (
            renderUploadZone(
              secondaryDragging,
              handleSecondaryDragOver,
              handleSecondaryDragLeave,
              handleSecondaryDrop,
              () => secondaryInputRef.current?.click(),
              secondaryInputRef,
              secondaryAcceptedFormats,
              handleSecondaryFileInput,
              secondaryIcon || <FileSpreadsheet className="h-6 w-6 text-white" />,
              secondaryLabel,
              secondaryError
            )
          )}
        </div>
      </div>

      {(primaryFile || secondaryFile) && (
        <div className="flex items-center justify-center gap-2 text-sm">
          <div className="flex items-center gap-2">
            {primaryFile ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">ZIP uploaded</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>ZIP required</span>
              </div>
            )}
            <span className="text-gray-400">•</span>
            {secondaryFile ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">CSV uploaded</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>CSV required</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
