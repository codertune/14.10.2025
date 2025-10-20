import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Plus, FileText, Globe, Building, CreditCard, Truck, BarChart3, DollarSign, Sparkles, Award, Zap } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  features: string[];
}

const services: Service[] = [
  // PDF Extractor
  {
    id: 'pdf-excel-converter',
    name: 'PDF to Excel/CSV Converter',
    description: 'Advanced PDF table extraction with intelligent recognition and multiple output formats.',
    category: 'PDF Extractor',
    features: ['Intelligent table detection', 'Multiple extraction methods', 'Excel/CSV output', 'Commercial document patterns']
  },

  // Bangladesh Bank Services
  {
    id: 'exp-issue',
    name: 'Issue EXP',
    description: 'Automated EXP issuance through Bangladesh Bank portal with form filling and validation.',
    category: 'Bangladesh Bank',
    features: ['Automated form filling', 'Validation checks', 'Certificate download', 'Bulk processing']
  },
  {
    id: 'exp-correction',
    name: 'Issued EXP Correction (Before Duplicate Reporting)',
    description: 'Correct issued EXP details before duplicate reporting with automated form updates.',
    category: 'Bangladesh Bank',
    features: ['Error detection', 'Automated corrections', 'Pre-duplicate validation', 'Status tracking']
  },
  {
    id: 'exp-duplicate-reporting',
    name: 'Duplicate EXP',
    description: 'Handle export acknowledgements and duplicate EXP reporting automatically.',
    category: 'Bangladesh Bank',
    features: ['Duplicate detection', 'Acknowledgement processing', 'Report generation', 'Compliance tracking']
  },
  {
    id: 'exp-search',
    name: 'Search EXP Detail Information',
    description: 'Search and retrieve detailed EXP information from Bangladesh Bank database.',
    category: 'Bangladesh Bank',
    features: ['Advanced search', 'Detailed reports', 'Export to Excel', 'Historical data']
  },

  // Damco Services
  {
    id: 'damco-booking',
    name: 'Damco (APM) - Booking',
    description: 'Automated booking creation through Damco APM portal with shipment details.',
    category: 'Forwarder Handler - Damco',
    features: ['Automated booking', 'Shipment scheduling', 'Container allocation', 'Booking confirmation']
  },
  {
    id: 'damco-booking-download',
    name: 'Damco (APM) - Booking Download',
    description: 'Download booking confirmations and related documents from Damco portal.',
    category: 'Forwarder Handler - Damco',
    features: ['Document download', 'PDF extraction', 'Batch processing', 'File organization']
  },
  {
    id: 'damco-fcr-submission',
    name: 'Damco (APM) - FCR Submission',
    description: 'Submit Forwarder Cargo Receipt (FCR) through Damco portal automatically.',
    category: 'Forwarder Handler - Damco',
    features: ['FCR automation', 'Document validation', 'Submission tracking', 'Status updates']
  },
  {
    id: 'damco-fcr-extractor',
    name: 'Damco (APM) - FCR Extractor from Mail',
    description: 'Extract FCR documents from email attachments and process automatically.',
    category: 'Forwarder Handler - Damco',
    features: ['Email processing', 'Attachment extraction', 'OCR recognition', 'Data parsing']
  },
  {
    id: 'damco-edoc-upload',
    name: 'Damco (APM) - E-Doc Upload',
    description: 'Upload electronic documents to Damco portal with automated categorization.',
    category: 'Forwarder Handler - Damco',
    features: ['Document upload', 'Auto categorization', 'Batch processing', 'Upload verification']
  },

  // H&M Services
  {
    id: 'hm-einvoice-create',
    name: 'H&M - E-Invoice Create',
    description: 'Create electronic invoices in H&M supplier portal with automated data entry.',
    category: 'Buyer Handler - H&M',
    features: ['Invoice automation', 'Data validation', 'Multi-item support', 'Template matching']
  },
  {
    id: 'hm-einvoice-download',
    name: 'H&M - E-Invoice Download',
    description: 'Download processed e-invoices and related documents from H&M portal.',
    category: 'Buyer Handler - H&M',
    features: ['Bulk download', 'PDF generation', 'Status tracking', 'Archive management']
  },
  {
    id: 'hm-einvoice-correction',
    name: 'H&M - E-Invoice Correction',
    description: 'Correct and resubmit e-invoices with error handling and validation.',
    category: 'Buyer Handler - H&M',
    features: ['Error detection', 'Automated corrections', 'Resubmission', 'Approval tracking']
  },
  {
    id: 'hm-packing-list',
    name: 'H&M - Download E-Packing List',
    description: 'Download electronic packing lists from H&M supplier portal.',
    category: 'Buyer Handler - H&M',
    features: ['Packing list download', 'Format conversion', 'Data extraction', 'Batch processing']
  },

  // BEPZA Services
  {
    id: 'bepza-ep-issue',
    name: 'BEPZA - EP Issue',
    description: 'Issue Export Permits (EP) through BEPZA portal with automated form submission.',
    category: 'BEPZA',
    features: ['EP automation', 'Form validation', 'Document upload', 'Permit tracking']
  },
  {
    id: 'bepza-ep-submission',
    name: 'BEPZA - EP Submission',
    description: 'Submit Export Permit applications with supporting documents to BEPZA.',
    category: 'BEPZA',
    features: ['Application submission', 'Document management', 'Status monitoring', 'Approval tracking']
  },
  {
    id: 'bepza-ep-download',
    name: 'BEPZA - EP Download',
    description: 'Download approved Export Permits and certificates from BEPZA portal.',
    category: 'BEPZA',
    features: ['Permit download', 'Certificate extraction', 'Batch processing', 'File organization']
  },
  {
    id: 'bepza-ip-issue',
    name: 'BEPZA - IP Issue',
    description: 'Issue Import Permits (IP) through BEPZA portal with automated processing.',
    category: 'BEPZA',
    features: ['IP automation', 'Compliance checks', 'Document validation', 'Permit generation']
  },
  {
    id: 'bepza-ip-submit',
    name: 'BEPZA - IP Submit',
    description: 'Submit Import Permit applications with required documentation to BEPZA.',
    category: 'BEPZA',
    features: ['Application processing', 'Document upload', 'Validation checks', 'Submission tracking']
  },
  {
    id: 'bepza-ip-download',
    name: 'BEPZA - IP Download',
    description: 'Download approved Import Permits and related documents from BEPZA.',
    category: 'BEPZA',
    features: ['Permit retrieval', 'Document download', 'Status updates', 'Archive management']
  },

  // Cash Incentive Services
  {
    id: 'cash-incentive-application',
    name: 'Cash Incentive Application',
    description: 'Submit cash incentive applications through multiple government portals.',
    category: 'Cash Incentive Applications',
    features: ['Multi-portal support', 'Document upload', 'Application tracking', 'Status monitoring']
  },
  {
    id: 'ctg-port-tracking',
    name: 'CTG Port Authority Tracking',
    description: 'Track shipments through Chittagong Port Authority with real-time updates.',
    category: 'Tracking Services',
    features: ['Real-time tracking', 'Port status', 'Vessel information', 'ETA updates']
  },
  {
    id: 'damco-tracking-maersk',
    name: 'Damco (APM) Tracking',
    description: 'Track shipments through Damco APM with detailed status reports.',
    category: 'Tracking Services',
    features: ['Container tracking', 'Status updates', 'Route information', 'Delivery confirmation']
  },
  {
    id: 'myshipment-tracking',
    name: 'MyShipment Tracking (MGH)',
    description: 'Track shipments through MyShipment MGH platform with comprehensive details.',
    category: 'Tracking Services',
    features: ['Multi-carrier tracking', 'Status notifications', 'Delivery updates', 'Historical data']
  },
  {
    id: 'egm-download',
    name: 'EGM Download (Bill Tracking)',
    description: 'Track Bill of Entry (B/E) status through Bangladesh Customs portal with automated PDF reports.',
    category: 'Tracking Services',
    features: ['Bill tracking automation', 'PDF report generation', 'Customs clearance status', 'Batch processing']
  },
  {
    id: 'custom-tracking',
    name: 'Custom Tracking',
    description: 'Track customs clearance status with automated status updates.',
    category: 'Tracking Services',
    features: ['Customs tracking', 'Clearance status', 'Document verification', 'Process monitoring']
  }
];

const categoryIcons: { [key: string]: React.ReactNode } = {
  'PDF Extractor': <FileText className="h-6 w-6" />,
  'Bangladesh Bank': <Globe className="h-6 w-6" />,
  'Forwarder Handler - Damco': <Truck className="h-6 w-6" />,
  'Buyer Handler - H&M': <Building className="h-6 w-6" />,
  'BEPZA': <BarChart3 className="h-6 w-6" />,
  'Cash Incentive Applications': <DollarSign className="h-6 w-6" />,
  'Tracking Services': <Truck className="h-6 w-6" />
};

export default function ServicePage() {
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [scrollY, setScrollY] = useState(0);
  const { addToCart, isInCart } = useCart();
  const { user, creditSettings, isServiceEnabled, getServiceCreditCost } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter services based on admin settings
  const enabledServices = services.filter(service => isServiceEnabled(service.id));

  const categories = Array.from(new Set(services.map(service => service.category)));

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleAddToCart = (service: Service) => {
    const credits = getServiceCreditCost(service.id);
    const price = credits / creditSettings.creditsPerBDT;
    
    addToCart({
      id: service.id,
      name: service.name,
      category: service.category,
      credits: credits,
      price: price
    });
  };

  const getCategoryServices = (category: string) => {
    return services.filter(service => service.category === category);
  };

  const getTotalCredits = () => {
    return enabledServices.reduce((total, service) => total + getServiceCreditCost(service.id), 0);
  };

  const getTotalPrice = () => {
    return enabledServices.reduce((total, service) => total + (getServiceCreditCost(service.id) / creditSettings.creditsPerBDT), 0);
  };

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
              <span className="text-sm font-medium text-gray-700">28+ Automation Services Available</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
              <span className="bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent">
                Automation Services
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed font-light">
              Complete suite of 28 automation services for Bangladesh commercial processes.
              From PDF extraction to export documentation and REX submission, we handle it all.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{enabledServices.length}</div>
                </div>
                <div className="text-gray-600 font-semibold text-sm tracking-wide uppercase">Total Services</div>
              </div>
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">{getTotalCredits()}</div>
                </div>
                <div className="text-gray-600 font-semibold text-sm tracking-wide uppercase">Total Credits Available</div>
              </div>
              <div className="group bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="relative inline-block mb-3">
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div className="relative text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent group-hover:scale-110 transition-transform">?{getTotalPrice()}</div>
                </div>
                <div className="text-gray-600 font-semibold text-sm tracking-wide uppercase">Total Value</div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute top-32 left-20 w-3 h-3 bg-cyan-500 rounded-full animate-ping"></div>
        <div className="absolute bottom-32 right-32 w-2 h-2 bg-teal-500 rounded-full animate-ping delay-500"></div>
        <div className="absolute top-1/2 right-20 w-4 h-4 bg-blue-400 rounded-full animate-pulse"></div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 rounded-full mb-4">
              <Award className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-cyan-700">Browse by Category</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4">
              Our Automation Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Select from our comprehensive suite of automation services organized by category
            </p>
          </div>

          <div className="space-y-6">
            {categories.map((category) => {
              const categoryServices = getCategoryServices(category);
              const isExpanded = expandedCategories.includes(category);
              
              return (
                <div key={category} className="group bg-white rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100">
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-8 py-6 flex items-center justify-between hover:bg-gradient-to-br hover:from-cyan-50/50 hover:to-blue-50/50 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                        {categoryIcons[category]}
                      </div>
                      <div className="text-left">
                        <h3 className="text-2xl font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">{category}</h3>
                        <p className="text-gray-500 mt-1">{categoryServices.length} services available</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6">
                      <div className="text-right bg-gradient-to-br from-cyan-50 to-blue-50 px-4 py-2 rounded-xl border border-cyan-100">
                        <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Credits</div>
                        <div className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                          {categoryServices.reduce((sum, s) => sum + getServiceCreditCost(s.id), 0)}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gradient-to-br from-gray-50/50 to-cyan-50/20">
                      <div className="p-8 space-y-6">
                        {categoryServices.map((service) => {
                          const credits = getServiceCreditCost(service.id);
                          const price = credits / creditSettings.creditsPerBDT;
                          
                          return (
                          <div
                            key={service.id}
                            className="group relative bg-white p-8 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                          >
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="flex justify-between items-start">
                              <div className="flex-1 relative">
                                <h4 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-cyan-600 transition-colors">
                                  {service.name}
                                </h4>
                                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                                
                                <div className="flex flex-wrap gap-2 mb-6">
                                  {service.features.map((feature, index) => (
                                    <span
                                      key={index}
                                      className="px-3 py-1.5 bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 text-sm rounded-full font-medium border border-cyan-200 hover:from-cyan-200 hover:to-blue-200 transition-all duration-200"
                                    >
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2 bg-gradient-to-r from-cyan-50 to-blue-50 px-3 py-2 rounded-lg border border-cyan-200">
                                    <CreditCard className="h-5 w-5 text-cyan-600" />
                                    <span className="text-sm font-bold text-cyan-700">
                                      {credits} credits
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2 bg-gradient-to-r from-teal-50 to-cyan-50 px-3 py-2 rounded-lg border border-teal-200">
                                    <DollarSign className="h-5 w-5 text-teal-600" />
                                    <span className="text-sm font-bold text-teal-700">
                                      ?{price.toFixed(2)}
                                    </span>
                                  </div>
                                </div>

                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-400/10 to-transparent rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                              </div>
                              
                              <div className="ml-6 relative">
                                <button
                                  onClick={() => handleAddToCart(service)}
                                  disabled={isInCart(service.id)}
                                  className={`px-6 py-3 rounded-2xl font-semibold transition-all duration-300 flex items-center shadow-lg ${
                                    isInCart(service.id)
                                      ? 'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 cursor-not-allowed border-2 border-teal-200'
                                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white hover:from-cyan-700 hover:to-blue-700 transform hover:scale-105 hover:shadow-2xl'
                                  }`}
                                >
                                  {isInCart(service.id) ? (
                                    'Added to Cart'
                                  ) : (
                                    <>
                                      <Plus className="h-5 w-5 mr-2" />
                                      Add to Cart
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Credit Information */}
          <div className="relative mt-16 bg-gradient-to-br from-cyan-600 via-blue-600 to-teal-700 rounded-3xl p-12 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-teal-400/20 rounded-full blur-3xl"></div>
            </div>

            <div className="text-center relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6 border border-white/30">
                <Zap className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Flexible Credit System</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-extrabold mb-6">Credit System Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl md:text-5xl font-extrabold mb-3">{creditSettings.creditsPerBDT}</div>
                  <div className="text-cyan-100 font-medium">Credits per BDT</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl md:text-5xl font-extrabold mb-3">{creditSettings.freeTrialCredits}</div>
                  <div className="text-cyan-100 font-medium">Free Trial Credits</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300">
                  <div className="text-4xl md:text-5xl font-extrabold mb-3">{creditSettings.minPurchaseCredits}</div>
                  <div className="text-cyan-100 font-medium">Min Purchase Credits</div>
                </div>
              </div>
              <p className="mt-8 text-lg text-cyan-50 leading-relaxed font-light">
                New users get {creditSettings.freeTrialCredits} free credits to try our services.
                Exchange rate: ?{(1/creditSettings.creditsPerBDT).toFixed(2)} = 1 Credit
              </p>

              <div className="absolute top-10 left-10 w-2 h-2 bg-white rounded-full animate-ping"></div>
              <div className="absolute bottom-10 right-10 w-3 h-3 bg-cyan-300 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* All Services Summary Section */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-blue-100 rounded-full mb-4 border border-cyan-200">
              <Sparkles className="h-4 w-4 text-cyan-600" />
              <span className="text-sm font-semibold text-cyan-700">Complete Service Catalog</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
              All Available Services
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Quick reference for all {enabledServices.length} automation services organized by category
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const categoryServices = getCategoryServices(category).filter(s => isServiceEnabled(s.id));
              if (categoryServices.length === 0) return null;

              return (
                <div key={category} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-gray-100 hover:border-cyan-200">
                  <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-4 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white">
                      {categoryIcons[category]}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-sm">{category}</h3>
                      <p className="text-xs text-cyan-100">{categoryServices.length} services</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    {categoryServices.map((service) => {
                      const credits = getServiceCreditCost(service.id);
                      const price = credits / creditSettings.creditsPerBDT;

                      return (
                        <div key={service.id} className="group">
                          <div className="text-sm font-medium text-gray-700 group-hover:text-cyan-600 transition-colors mb-1">
                            {service.name}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">{credits} credits</span>
                            <span className="font-bold text-green-600">?{price.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl p-8 border-2 border-cyan-200 text-center">
              <div className="text-4xl font-extrabold text-cyan-600 mb-2">{enabledServices.length}</div>
              <div className="text-gray-700 font-semibold">Total Services Available</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-8 border-2 border-blue-200 text-center">
              <div className="text-4xl font-extrabold text-blue-600 mb-2">{categories.length}</div>
              <div className="text-gray-700 font-semibold">Service Categories</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-8 border-2 border-teal-200 text-center">
              <div className="text-4xl font-extrabold text-teal-600 mb-2">24/7</div>
              <div className="text-gray-700 font-semibold">Always Available</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}