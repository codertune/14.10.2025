import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-lg text-gray-600 mb-8">
            Sorry, the page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-center mb-6">
            <Search className="w-16 h-16 text-gray-400" />
          </div>
          <p className="text-gray-700 mb-6">
            The page you requested could not be found. This might be because:
          </p>
          <ul className="text-left text-gray-600 space-y-2 max-w-md mx-auto mb-8">
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The URL was typed incorrectly</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The page has been removed or relocated</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">•</span>
              <span>The link you followed is outdated</span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-gray-600 mb-4">Need help? Check out these pages:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/services" className="text-blue-600 hover:text-blue-800 hover:underline">
              Services
            </Link>
            <Link to="/contact" className="text-blue-600 hover:text-blue-800 hover:underline">
              Contact Us
            </Link>
            <Link to="/blog" className="text-blue-600 hover:text-blue-800 hover:underline">
              Blog
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
