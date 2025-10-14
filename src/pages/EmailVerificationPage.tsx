import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader, Mail } from 'lucide-react';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  useEffect(() => {
    if (status === 'success' && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (status === 'success' && countdown === 0) {
      navigate('/');
    }
  }, [status, countdown, navigate]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage(result.message);
        setUserEmail(result.user?.email || '');
      } else {
        setStatus('error');
        setMessage(result.message);

        if (result.message?.includes('expired')) {
          setUserEmail(result.email || '');
        }
      }
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred while verifying your email. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) {
      setMessage('Unable to resend verification email. Please try registering again.');
      return;
    }

    setResendingEmail(true);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userEmail }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        setMessage(result.message || 'Failed to resend verification email.');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setResendingEmail(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {status === 'loading' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <Loader className="h-16 w-16 text-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying Your Email
              </h2>
              <p className="text-gray-600">
                Please wait while we verify your email address...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Email Verified Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                {message || 'Your email has been verified. You can now login to your account.'}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-700">
                  Redirecting to login page in <span className="font-bold">{countdown}</span> seconds...
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                Go to Login Now
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-red-100 rounded-full p-4">
                  <XCircle className="h-16 w-16 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verification Failed
              </h2>
              <p className="text-gray-600 mb-6">
                {message || 'We could not verify your email address.'}
              </p>

              {message?.includes('expired') && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-yellow-800 mb-2">
                        Verification Link Expired
                      </p>
                      <p className="text-sm text-yellow-700 mb-3">
                        Your verification link has expired. Verification links are valid for 24 hours.
                      </p>
                      <button
                        onClick={handleResendVerification}
                        disabled={resendingEmail}
                        className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {resendingEmail ? 'Sending...' : 'Resend Verification Email'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Go to Home
                </button>

                {!message?.includes('expired') && (
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Try Registering Again
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <a href="/contact" className="text-blue-600 hover:text-blue-800 font-medium">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
