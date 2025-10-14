import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Key, CheckCircle, AlertCircle, Trash2, TestTube, Loader2 } from 'lucide-react';
import axios from 'axios';

interface PortalCredentialsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  portalName: string;
  portalDisplayName: string;
}

export default function PortalCredentialsModal({
  isOpen,
  onClose,
  userId,
  portalName,
  portalDisplayName
}: PortalCredentialsModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ valid: boolean; message: string } | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [hasExistingCredentials, setHasExistingCredentials] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadExistingCredentials();
    }
  }, [isOpen, userId, portalName]);

  const loadExistingCredentials = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/credentials/check/${portalName}?userId=${userId}`);
      if (response.data.success && response.data.exists) {
        setHasExistingCredentials(true);

        // Load the actual credentials to show username
        const credResponse = await axios.get(`/api/credentials/${portalName}?userId=${userId}`);
        if (credResponse.data.success) {
          setUsername(credResponse.data.data.username);
        }
      }
    } catch (err: any) {
      // No credentials exist, that's okay
      setHasExistingCredentials(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }

    if (!password.trim()) {
      setError('Password is required');
      return false;
    }

    return true;
  };

  const handleTestCredentials = async () => {
    setError('');
    setTestResult(null);

    if (!validateForm()) {
      return;
    }

    setIsTesting(true);

    try {
      const response = await axios.post('/api/credentials/test', {
        userId,
        portalName,
        username: username.trim(),
        password
      });

      if (response.data.success) {
        setTestResult({
          valid: true,
          message: 'Credentials are valid and working!'
        });
      } else {
        setTestResult({
          valid: false,
          message: response.data.message || 'Credentials test failed'
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to test credentials';
      setTestResult({
        valid: false,
        message: errorMessage
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/credentials/save', {
        userId,
        portalName,
        username: username.trim(),
        password
      });

      if (response.data.success) {
        setSuccess(true);
        setHasExistingCredentials(true);

        setTimeout(() => {
          onClose();
          setSuccess(false);
          setPassword('');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save credentials');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete these credentials? You will need to re-enter them to use this service.')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const response = await axios.delete(`/api/credentials/${portalName}`, {
        data: { userId }
      });

      if (response.data.success) {
        setSuccess(true);
        setHasExistingCredentials(false);
        setUsername('');
        setPassword('');

        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete credentials');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isDeleting) {
      setPassword('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Key className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Portal Credentials</h2>
              <p className="text-sm text-gray-500">{portalDisplayName}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting || isDeleting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading credentials...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-700">
                  {hasExistingCredentials ? 'Credentials saved successfully!' : 'Credentials deleted successfully!'}
                </p>
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Portal Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isSubmitting || isDeleting}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your portal username"
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Portal Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting || isDeleting}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed pr-10"
                  placeholder="Enter your portal password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || isDeleting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {testResult && (
              <div className={`border rounded-lg p-4 ${
                testResult.valid
                  ? 'bg-green-50 border-green-200'
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {testResult.valid ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm ${
                    testResult.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {testResult.message}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Security Note:</strong> Your credentials are encrypted and stored securely. They are only used for automation and are never shared.
              </p>
            </div>

            <div className="flex flex-col space-y-3 pt-4">
              <button
                type="button"
                onClick={handleTestCredentials}
                disabled={isSubmitting || isDeleting || isTesting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Testing Credentials...</span>
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4" />
                    <span>Test Credentials</span>
                  </>
                )}
              </button>

              <div className="flex space-x-3">
                {hasExistingCredentials && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isSubmitting || isDeleting || isTesting}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting || isTesting}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>{hasExistingCredentials ? 'Update' : 'Save'} Credentials</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
