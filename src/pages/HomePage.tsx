import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, FileText, Users, Clock, Shield, BarChart3, Zap, Globe, TrendingUp, Sparkles, Rocket, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { creditSettings } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "PDF to Excel Conversion",
      description: "Advanced PDF table extraction with intelligent recognition"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Bangladesh Bank Integration",
      description: "Complete EXP management and export documentation"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Secure Automation",
      description: "Bank-grade security with encrypted data processing"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Real-time Processing",
      description: "Instant automation with live progress tracking"
    }
  ];

  const stats = [
    { number: "27+", label: "Automation Services" },
    { number: "100%", label: "Success Rate" },
    { number: "24/7", label: "Available" },
    { number: "1000+", label: "Processes Daily" }
  ];

  const trustedCompanies = [
    "H&M", "Walmart", "Target", "BEPZA", "EPB", "Bangladesh Bank"
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 pt-24 pb-20">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-400/30 to-emerald-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgb(6 182 212 / 0.15) 1px, transparent 0)`,
              backgroundSize: '40px 40px',
              transform: `translateY(${scrollY * 0.5}px)`
            }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-cyan-200 mb-6 shadow-lg">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-medium text-gray-700">Trusted by 1000+ businesses daily</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              <span className="inline-block animate-fade-in">
                <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Smart Process Flow
                </span>
              </span>
              <br />
              <span className="text-gray-800 text-4xl md:text-6xl inline-block mt-2">
                Automate Your Business
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
              Streamline Bangladesh commercial processes with our intelligent SaaS platform.
              From export documentation to cash incentives, we automate your complex workflows with precision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/services"
                className="group relative bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-10 py-5 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl shadow-xl flex items-center overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-blue-600 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative">Explore Services</span>
                <ArrowRight className="ml-2 h-5 w-5 relative group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/contact"
                className="group relative bg-white border-2 border-gray-200 text-gray-700 px-10 py-5 rounded-2xl font-semibold hover:border-cyan-500 hover:text-cyan-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl backdrop-blur-sm"
              >
                Book Demo
                <Clock className="inline-block ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
              </Link>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {trustedCompanies.map((company, index) => (
                <div key={index} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
                  {company}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute top-32 left-20 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 right-32 w-2 h-2 bg-teal-500 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-1/2 right-20 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="group text-center p-6 rounded-2xl transition-all duration-300 hover:bg-white hover:shadow-xl"
              >
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                    {stat.number}
                  </div>
                </div>
                <div className="text-gray-600 font-semibold text-sm md:text-base tracking-wide uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 rounded-full mb-4">
              <Award className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-cyan-700">World-Class Features</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              Powerful Automation Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Our platform combines cutting-edge technology with deep understanding of Bangladesh commercial processes
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white p-8 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-3 border border-gray-100 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="relative">
                  <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    {feature.icon}
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-teal-100 rounded-full mb-6">
                <Rocket className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-semibold text-teal-700">Complete Automation</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                Complete Export Process Automation
              </h2>

              <p className="text-lg text-gray-600 mb-10 leading-relaxed">
                From PDF extraction to Bangladesh Bank EXP processing, we handle your entire export documentation workflow automatically.
              </p>

              <div className="space-y-5 mb-10">
                {[
                  "PDF to Excel conversion with intelligent table detection",
                  "Bangladesh Bank EXP issuance and management",
                  "Damco booking and FCR submission",
                  "H&M e-invoice creation and management",
                  "BEPZA permit processing and tracking"
                ].map((item, index) => (
                  <div key={index} className="flex items-start group">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 flex items-center justify-center mr-4 mt-0.5 group-hover:scale-110 transition-transform">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-gray-700 leading-relaxed group-hover:text-gray-900 transition-colors">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to="/services"
                className="group inline-flex items-center bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-8 py-4 rounded-2xl font-semibold hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
              >
                View All Services
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="relative order-1 lg:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>

              <div className="relative bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-600 rounded-3xl p-10 text-white shadow-2xl">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>

                <div className="relative">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm mb-6">
                    <BarChart3 className="h-10 w-10" />
                  </div>

                  <h3 className="text-3xl font-bold mb-4">Real-Time Processing</h3>

                  <p className="text-cyan-50 mb-8 text-lg leading-relaxed">
                    Monitor your automation tasks with live progress updates and comprehensive logging.
                  </p>

                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Processing invoices...</span>
                      <span className="text-sm font-bold">75%</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <div className="bg-gradient-to-r from-white to-cyan-200 rounded-full h-3 w-3/4 transition-all duration-300 shadow-lg"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-gradient-to-br from-gray-50 via-cyan-50/30 to-blue-50/30 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-1/4 w-2 h-2 bg-cyan-500 rounded-full animate-ping"></div>
          <div className="absolute bottom-20 right-1/4 w-2 h-2 bg-blue-500 rounded-full animate-ping delay-1000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-4 shadow-md">
              <Zap className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-gray-700">Simple Process</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              How It Works
            </h2>

            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Get started in minutes with our simple three-step process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10 relative">
            <div className="hidden md:block absolute top-24 left-1/3 w-1/3 h-1 bg-gradient-to-r from-cyan-300 via-blue-300 to-teal-300 opacity-30"></div>

            {[
              {
                step: "1",
                title: "Upload Your Files",
                description: "Simply drag and drop your PDFs, Excel files, or CSV documents. Our system automatically analyzes and calculates credits needed.",
                gradient: "from-cyan-500 to-blue-600"
              },
              {
                step: "2",
                title: "Choose Your Service",
                description: "Select from our 27+ automation services. Add to cart and purchase credits securely via bKash payment.",
                gradient: "from-blue-500 to-teal-600"
              },
              {
                step: "3",
                title: "Automate & Download",
                description: "Watch real-time progress as our AI processes your documents. Download results instantly upon completion.",
                gradient: "from-teal-500 to-cyan-600"
              }
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="text-center bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className="relative inline-block mb-6">
                    <div className={`w-20 h-20 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                      {item.step}
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-cyan-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity"></div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-cyan-600 transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-700 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full">
            <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
            <div className="absolute top-20 right-20 w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
            <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-white rounded-full animate-ping delay-1000"></div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/30">
            <TrendingUp className="h-4 w-4 text-white" />
            <span className="text-sm font-semibold text-white">Join 1000+ businesses</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
            Ready to Automate Your Business?
          </h2>

          <p className="text-xl md:text-2xl text-cyan-50 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
            Join hundreds of companies already streamlining their operations with Smart Process Flow.
            Start your free trial today with {creditSettings.freeTrialCredits} credits.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <Link
              to="/services"
              className="group relative bg-white text-cyan-600 px-10 py-5 rounded-2xl font-bold hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center overflow-hidden"
            >
              <span className="relative">Start Free Trial</span>
              <Users className="ml-2 h-5 w-5 relative group-hover:rotate-12 transition-transform" />
            </Link>

            <Link
              to="/contact"
              className="group relative bg-transparent border-2 border-white text-white px-10 py-5 rounded-2xl font-bold hover:bg-white/10 transition-all duration-300 transform hover:scale-105 flex items-center backdrop-blur-sm"
            >
              Contact Sales
              <Clock className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-8 text-white/90">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">{creditSettings.freeTrialCredits} free trial credits</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">bKash payment</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full"></div>
              <span className="text-sm font-medium">Bank-grade security</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}