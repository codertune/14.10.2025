import React from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-600/10 to-cyan-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-20 left-1/4 w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 right-1/3 w-2 h-2 bg-teal-500 rounded-full animate-ping delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <div className="flex items-center mb-4 group">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <span className="ml-3 text-xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent">Smart Process Flow</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Automate your Bangladesh commercial processes with our intelligent SaaS platform. 
              From export documentation to cash incentives, we streamline your business operations.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-cyan-400 hover:bg-white/10 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-cyan-400">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Home
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Services
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Popular Services */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-cyan-400">Popular Services</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/services" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Bangladesh Bank
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Damco Services
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  Tracking Services
                </Link>
              </li>
              <li>
                <Link to="/services" className="text-gray-300 hover:text-cyan-400 transition-colors duration-200 inline-flex items-center group">
                  <span className="w-0 group-hover:w-2 h-0.5 bg-cyan-400 transition-all duration-200 mr-0 group-hover:mr-2"></span>
                  PDF to Excel
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4 text-cyan-400">Contact Info</h3>
            <div className="space-y-4">
              <div className="flex items-center group">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center mr-3 group-hover:bg-cyan-500/20 transition-colors">
                  <Mail className="h-4 w-4 text-cyan-400" />
                </div>
                <span className="text-gray-300 text-sm group-hover:text-cyan-400 transition-colors">support@smartprocessflow.com</span>
              </div>
              <div className="flex items-center group">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center mr-3 group-hover:bg-teal-500/20 transition-colors">
                  <Phone className="h-4 w-4 text-teal-400" />
                </div>
                <span className="text-gray-300 text-sm group-hover:text-cyan-400 transition-colors">+880 1947-214525</span>
              </div>
              <div className="flex items-center group">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mr-3 group-hover:bg-blue-500/20 transition-colors">
                  <MapPin className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-gray-300 text-sm group-hover:text-cyan-400 transition-colors">Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800/50 mt-12 pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Smart Process Flow. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <Link to="/privacy" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link to="/contact" className="text-gray-400 hover:text-cyan-400 text-sm transition-colors duration-200">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}