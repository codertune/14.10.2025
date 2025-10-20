import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { FileText, Globe, Truck, Building, BarChart3, DollarSign, CreditCard, TrendingUp, Activity, Zap, AlertCircle, CheckCircle, Download, LayoutDashboard, User as UserIcon, History, Lock, Save, X, CreditCard as Edit2, Key } from 'lucide-react';
import ServiceSelector from '../components/ServiceSelector';
import FileUploadZone from '../components/FileUploadZone';
import CreditCalculator from '../components/CreditCalculator';
import WorkHistoryPanel from '../components/WorkHistoryPanel';
import CreditPurchaseModal from '../components/CreditPurchaseModal';
import TransactionHistory from '../components/TransactionHistory';
import CreditUsageAnalytics from '../components/CreditUsageAnalytics';
import ChangePasswordModal from '../components/ChangePasswordModal';
import CreditHistoryTab from '../components/CreditHistoryTab';
import PortalCredentialsManager from '../components/PortalCredentialsManager';
import PortalCredentialsModal from '../components/PortalCredentialsModal';
import AdSenseAd from '../components/AdSenseAd';
import axios from 'axios';

interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
}

const allServices: Service[] = [
  { id: 'pdf-excel-converter', name: 'PDF to Excel/CSV', description: 'Convert PDF tables to Excel/CSV with intelligent recognition', category: 'PDF Extractor', icon: <FileText className="h-5 w-5" /> },
  { id: 'exp-issue', name: 'Issue EXP', description: 'Automated EXP issuance through Bangladesh Bank portal', category: 'Bangladesh Bank', icon: <Globe className="h-5 w-5" /> },
  { id: 'exp-correction', name: 'Issued EXP Correction', description: 'Correct issued EXP details before duplicate reporting', category: 'Bangladesh Bank', icon: <Globe className="h-5 w-5" /> },
  { id: 'exp-duplicate-reporting', name: 'Duplicate EXP', description: 'Handle export acknowledgements and duplicate EXP reporting', category: 'Bangladesh Bank', icon: <Globe className="h-5 w-5" /> },
  { id: 'exp-search', name: 'Search EXP Details', description: 'Search and retrieve detailed EXP information from database', category: 'Bangladesh Bank', icon: <Globe className="h-5 w-5" /> },
  { id: 'damco-booking', name: 'Damco Booking', description: 'Automated booking creation through Damco APM portal', category: 'Forwarder Handler', icon: <Truck className="h-5 w-5" /> },
  { id: 'damco-booking-download', name: 'Damco Booking Download', description: 'Download booking confirmations and related documents', category: 'Forwarder Handler', icon: <Truck className="h-5 w-5" /> },
  { id: 'damco-fcr-submission', name: 'Damco FCR Submission', description: 'Submit Forwarder Cargo Receipt through Damco portal', category: 'Forwarder Handler', icon: <Truck className="h-5 w-5" /> },
  { id: 'damco-fcr-extractor', name: 'Damco FCR Extractor', description: 'Extract FCR documents from email attachments', category: 'Forwarder Handler', icon: <Truck className="h-5 w-5" /> },
  { id: 'damco-edoc-upload', name: 'Damco E-Doc Upload', description: 'Upload electronic documents to Damco portal', category: 'Forwarder Handler', icon: <Truck className="h-5 w-5" /> },
  { id: 'hm-einvoice-create', name: 'H&M E-Invoice Create', description: 'Create electronic invoices in H&M supplier portal', category: 'Buyer Handler', icon: <Building className="h-5 w-5" /> },
  { id: 'hm-einvoice-download', name: 'H&M E-Invoice Download', description: 'Download processed e-invoices and related documents', category: 'Buyer Handler', icon: <Building className="h-5 w-5" /> },
  { id: 'hm-einvoice-correction', name: 'H&M E-Invoice Correction', description: 'Correct and resubmit e-invoices with error handling', category: 'Buyer Handler', icon: <Building className="h-5 w-5" /> },
  { id: 'hm-packing-list', name: 'H&M E-Packing List', description: 'Download electronic packing lists from H&M portal', category: 'Buyer Handler', icon: <Building className="h-5 w-5" /> },
  { id: 'bepza-ep-issue', name: 'BEPZA EP Issue', description: 'Issue Export Permits through BEPZA portal', category: 'BEPZA', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'bepza-ep-submission', name: 'BEPZA EP Submission', description: 'Submit Export Permit applications to BEPZA', category: 'BEPZA', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'bepza-ep-download', name: 'BEPZA EP Download', description: 'Download approved Export Permits and certificates', category: 'BEPZA', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'bepza-ip-issue', name: 'BEPZA IP Issue', description: 'Issue Import Permits through BEPZA portal', category: 'BEPZA', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'bepza-ip-submit', name: 'BEPZA IP Submit', description: 'Submit Import Permit applications to BEPZA', category: 'BEPZA', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'bepza-ip-download', name: 'BEPZA IP Download', description: 'Download approved Import Permits and documents', category: 'BEPZA', icon: <BarChart3 className="h-5 w-5" /> },
  { id: 'cash-incentive-application', name: 'Cash Incentive Application', description: 'Submit cash incentive applications through portals', category: 'Cash Incentive', icon: <DollarSign className="h-5 w-5" /> },
  { id: 'ctg-port-tracking', name: 'CTG Port Tracking', description: 'Track shipments through Chittagong Port Authority', category: 'Tracking', icon: <Truck className="h-5 w-5" /> },
  { id: 'damco-tracking-maersk', name: 'Damco (APM) Tracking', description: 'Track shipments through Damco APM portal', category: 'Tracking', icon: <Truck className="h-5 w-5" /> },
  { id: 'myshipment-tracking', name: 'MyShipment Tracking', description: 'Track shipments through MyShipment MGH platform', category: 'Tracking', icon: <Truck className="h-5 w-5" /> },
  { id: 'egm-download', name: 'EGM Download', description: 'Download Export General Manifest documents', category: 'Tracking', icon: <Truck className="h-5 w-5" /> },
  { id: 'custom-tracking', name: 'Custom Tracking', description: 'Track customs clearance status and updates', category: 'Tracking', icon: <Truck className="h-5 w-5" /> },
  { id: 'rex-soo-submission', name: 'REX/SOO Submission', description: 'Automated REX/SOO form submission to EPB Export Tracker', category: 'EPB Export', icon: <Globe className="h-5 w-5" /> }
];

type TabType = 'dashboard' | 'profile' | 'credentials' | 'credits' | 'transactions' | 'credit-history';

export default function NewDashboard() {
  const { user, deductCredits, addWorkHistory, getServiceCreditCost, isServiceEnabled, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rowCount, setRowCount] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [jobStartTime, setJobStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [showCreditPurchaseModal, setShowCreditPurchaseModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [credentialsRequired, setCredentialsRequired] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    company: user?.company || '',
    mobile: user?.mobile || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentJob, setCurrentJob] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [workHistoryPage, setWorkHistoryPage] = useState(1);
  const [workHistoryPagination, setWorkHistoryPagination] = useState<any>(null);

  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  }>({ show: false, message: '', type: 'info' });

  const enabledServices = allServices.filter(service => isServiceEnabled(service.id));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['dashboard', 'profile', 'credentials', 'credits', 'transactions', 'credit-history'].includes(tab)) {
      setActiveTab(tab as TabType);
    }
  }, [location.search]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate(`/dashboard?tab=${tab}`, { replace: true });
  };

  const handleServiceSelect = async (service: Service) => {
    setSelectedService(service);
    setSelectedFile(null);
    setRowCount(0);
    setTotalCredits(0);
    setShowConfirmation(false);

    const servicesRequiringCredentials = ['exp-search', 'rex-soo-submission'];
    const requiresCreds = servicesRequiringCredentials.includes(service.id);
    setCredentialsRequired(requiresCreds);

    if (requiresCreds && user) {
      try {
        const portalName = service.id === 'rex-soo-submission' ? 'epb_export_tracker' : 'bangladesh_bank_exp';
        const response = await axios.get(`/api/credentials/check/${portalName}?userId=${user.id}`);
        setHasCredentials(response.data.exists);
      } catch (error) {
        setHasCredentials(false);
      }
    } else {
      setHasCredentials(true);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setShowConfirmation(false);
  };

  const handleFileClear = () => {
    setSelectedFile(null);
    setRowCount(0);
    setTotalCredits(0);
    setShowConfirmation(false);
  };

  const handleCalculationComplete = (rows: number, credits: number) => {
    setRowCount(rows);
    setTotalCredits(credits);
    setShowConfirmation(true);
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const stopElapsedTimer = () => {
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const startElapsedTimer = () => {
    const startTime = Date.now();
    setJobStartTime(startTime);
    setElapsedTime(0);

    elapsedTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 1000);
  };

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const refreshWorkHistory = async (page = workHistoryPage, retries = 3, delay = 500) => {
    if (!user) return false;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Refreshing work history page ${page} (attempt ${attempt}/${retries})...`);
        const response = await fetch(`/api/work-history/${user.id}?page=${page}&limit=3`);
        const result = await response.json();

        if (result.success && result.workHistory) {
          console.log(`✅ Work history refreshed:`, {
            count: result.workHistory.length,
            page: result.pagination?.currentPage,
            totalPages: result.pagination?.totalPages,
            latest: result.workHistory[0]
          });
          updateUser({ workHistory: result.workHistory });
          setWorkHistoryPagination(result.pagination);
          return true;
        } else {
          console.warn(`⚠️ Work history refresh unsuccessful:`, result);
        }
      } catch (error) {
        console.error(`❌ Error refreshing work history (attempt ${attempt}):`, error);
        if (attempt < retries) {
          console.log(`⏱️ Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        }
      }
    }
    return false;
  };

  const handleWorkHistoryPageChange = (newPage: number) => {
    setWorkHistoryPage(newPage);
    refreshWorkHistory(newPage);
  };

  const startPolling = (jobId: string) => {
    setIsPolling(true);

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/status`);
        const data = await response.json();

        if (data.success) {
          setCurrentJob(data.job);

          if (data.job.status === 'completed') {
            console.log('🎉 Job completed! Job data:', data.job);
            stopPolling();
            stopElapsedTimer();

            // Add delay before refreshing to ensure database transaction commits
            setTimeout(async () => {
              console.log('🔄 Starting work history refresh after job completion...');
              const refreshed = await refreshWorkHistory();

              if (refreshed) {
                showNotification('Automation complete! Download your results in the work history below.', 'success');
              } else {
                showNotification('Automation complete! If download button doesn\'t appear, please refresh the page.', 'info');
              }

              setIsProcessing(false);
              setSelectedService(null);
              setSelectedFile(null);
              setRowCount(0);
              setTotalCredits(0);
              setShowConfirmation(false);
              setCurrentJob(null);
              setElapsedTime(0);
              setJobStartTime(null);
            }, 1000);
          } else if (data.job.status === 'failed') {
            stopPolling();
            stopElapsedTimer();
            setIsProcessing(false);
            showNotification(`Automation failed: ${data.job.errorMessage}`, 'error');
            setCurrentJob(null);
            setElapsedTime(0);
            setJobStartTime(null);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000);
  };

  useEffect(() => {
    return () => {
      stopPolling();
      stopElapsedTimer();
    };
  }, []);

  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification({ show: false, message: '', type: 'info' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  useEffect(() => {
    if (user && !workHistoryPagination) {
      refreshWorkHistory(1);
    }
  }, [user]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ show: true, message, type });
  };

  const handleProcessAutomation = async () => {
    if (!selectedFile || !selectedService || totalCredits === 0) {
      console.error('Missing required fields:', { selectedFile, selectedService, totalCredits });
      return;
    }

    if (user && user.credits < totalCredits) {
      showNotification('Insufficient credits. Please purchase more credits.', 'error');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('serviceId', selectedService.id);
      formData.append('userId', user!.id);
      formData.append('totalCredits', totalCredits.toString());

      console.log('📤 Submitting automation with credits:', {
        serviceId: selectedService.id,
        fileName: selectedFile.name,
        rowCount,
        totalCredits
      });

      const response = await fetch('/api/process-automation', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        if (result.newCredits !== undefined) {
          updateUser({ credits: result.newCredits });
        }

        setCurrentJob(result);
        startElapsedTimer();

        if (result.status !== 'completed') {
          startPolling(result.jobId);
        }

        const message = result.immediate
          ? 'Processing started!'
          : `Job queued at position ${result.queuePosition}`;
        showNotification(message, 'success');
      } else {
        const errorMsg = result.error || result.message || 'Unknown error';
        showNotification('Failed to start automation: ' + errorMsg, 'error');
        setIsProcessing(false);
      }
    } catch (error: any) {
      showNotification('Error processing automation: ' + error.message, 'error');
      setIsProcessing(false);
    }
  };

  const handleProfileEdit = () => {
    setIsEditingProfile(true);
    setProfileData({
      name: user?.name || '',
      company: user?.company || '',
      mobile: user?.mobile || ''
    });
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleProfileCancel = () => {
    setIsEditingProfile(false);
    setProfileData({
      name: user?.name || '',
      company: user?.company || '',
      mobile: user?.mobile || ''
    });
    setProfileError('');
    setProfileSuccess(false);
  };

  const handleProfileSave = async () => {
    if (!profileData.name || !profileData.company || !profileData.mobile) {
      setProfileError('All fields are required');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileSuccess(false);

    try {
      const response = await axios.put(`/api/users/${user!.id}/profile`, profileData);

      if (response.data.success) {
        updateUser(response.data.user);
        setProfileSuccess(true);
        setIsEditingProfile(false);

        setTimeout(() => {
          setProfileSuccess(false);
        }, 3000);
      }
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const stats = {
    totalProcesses: user?.workHistory.length || 0,
    creditsUsed: user?.workHistory.reduce((sum, item) => sum + item.creditsUsed, 0) || 0,
    successRate: user?.workHistory.length
      ? ((user.workHistory.filter(w => w.status === 'completed').length / user.workHistory.length) * 100).toFixed(0)
      : '0',
    todayProcesses: user?.workHistory.filter(item => {
      const today = new Date().toDateString();
      const itemDate = new Date(item.createdAt).toDateString();
      return today === itemDate;
    }).length || 0
  };

  const creditPercentage = user ? Math.min((user.credits / 1000) * 100, 100) : 0;

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: UserIcon },
    { id: 'credentials', label: 'Portal Access', icon: Key },
    { id: 'credits', label: 'Credits', icon: CreditCard },
    { id: 'transactions', label: 'Transactions', icon: History },
    { id: 'credit-history', label: 'Credit History', icon: Activity }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-600">{creditPercentage.toFixed(0)}%</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">Available Credits</p>
                <p className="text-3xl font-bold text-gray-900 mb-3">{(user?.credits || 0).toFixed(2)}</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${creditPercentage}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Today's Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats.todayProcesses}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Total Processes</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProcesses}</p>
              </div>

              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Success Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.successRate}%</p>
              </div>
            </div>

            {/* First Ad Placement - After Stats */}
            <AdSenseAd placement="dashboard_after_stats" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Start New Automation
                  </h2>
                  <p className="text-sm text-gray-600">
                    Select a service and upload your file to get started
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Step 1: Select Service
                    </label>
                    <ServiceSelector
                      services={enabledServices}
                      selectedService={selectedService}
                      onSelect={handleServiceSelect}
                    />
                  </div>

                  {selectedService && (
                    <>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Step 2: Upload File
                          </label>
                          <a
                            href={`/templates/${selectedService.id}-template.csv`}
                            download
                            className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download Sample</span>
                          </a>
                        </div>
                        <FileUploadZone
                          onFileSelect={handleFileSelect}
                          selectedFile={selectedFile}
                          onClear={handleFileClear}
                        />
                      </div>

                      {selectedFile && (
                        <CreditCalculator
                          file={selectedFile}
                          serviceId={selectedService.id}
                          creditCostPerUnit={getServiceCreditCost(selectedService.id)}
                          onCalculationComplete={handleCalculationComplete}
                        />
                      )}

                      {credentialsRequired && !hasCredentials && selectedFile && (
                        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-5">
                          <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Key className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-gray-900 mb-1">
                                Portal Credentials Required
                              </h3>
                              <p className="text-sm text-gray-700 mb-3">
                                This service requires Bangladesh Bank portal credentials to function.
                                Please configure your credentials before proceeding.
                              </p>
                              <button
                                onClick={() => setShowCredentialsModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                              >
                                <Key className="h-4 w-4" />
                                <span>Configure Credentials</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {showConfirmation && selectedFile && totalCredits > 0 && (
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-5">
                          <div className="flex items-start space-x-3 mb-4">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-base font-bold text-gray-900 mb-1">
                                Ready to Process
                              </h3>
                              <p className="text-xs text-gray-700 mb-2">
                                Process {rowCount} {rowCount === 1 ? 'item' : 'items'}, use {totalCredits.toFixed(2)} credits
                              </p>
                              {user && user.credits < totalCredits && (
                                <div className="flex items-start space-x-2 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
                                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                                  <p className="text-xs text-red-700">
                                    Insufficient credits. Need {totalCredits.toFixed(2)}, have {Number(user.credits).toFixed(2)}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={handleProcessAutomation}
                            disabled={isProcessing || (user && user.credits < totalCredits) || (credentialsRequired && !hasCredentials)}
                            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
                          >
                            {isProcessing ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4" />
                                <span>Start Automation</span>
                              </>
                            )}
                          </button>

                          {/* Second Ad Placement - After Button */}
                          <div className="mt-6">
                            <AdSenseAd placement="dashboard_after_button" />
                          </div>

                          {currentJob && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
                              {currentJob.status === 'queued' && (
                                <>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start space-x-2">
                                      <Activity className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                      <div>
                                        <p className="text-sm font-medium text-blue-900">Job Queued</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                          Position in queue: {currentJob.queuePosition}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-blue-600">Time elapsed</p>
                                      <p className="text-sm font-bold text-blue-900">{formatElapsedTime(elapsedTime)}</p>
                                    </div>
                                  </div>
                                </>
                              )}
                              {currentJob.status === 'processing' && (
                                <>
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-start space-x-2">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 flex-shrink-0 mt-0.5"></div>
                                      <div>
                                        <p className="text-sm font-medium text-blue-900">Processing Automation</p>
                                        <p className="text-xs text-blue-700 mt-1">
                                          {currentJob.progress ? `${currentJob.progress}% complete` : 'Processing your job...'}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-blue-600">Time elapsed</p>
                                      <p className="text-sm font-bold text-blue-900">{formatElapsedTime(elapsedTime)}</p>
                                    </div>
                                  </div>
                                  {currentJob.progress !== undefined && (
                                    <div className="space-y-1">
                                      <div className="w-full bg-blue-200 rounded-full h-2.5 overflow-hidden">
                                        <div
                                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                                          style={{ width: `${currentJob.progress || 0}%` }}
                                        />
                                      </div>
                                      <div className="flex justify-between text-xs">
                                        <span className="text-blue-700">Progress: {currentJob.progress || 0}%</span>
                                        {currentJob.progress > 0 && elapsedTime > 0 && (
                                          <span className="text-blue-600">
                                            ~{Math.ceil((elapsedTime / currentJob.progress) * (100 - currentJob.progress))}s remaining
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div>
                <WorkHistoryPanel
                  workHistory={user?.workHistory || []}
                  isProcessing={isProcessing}
                  onRefresh={() => refreshWorkHistory(workHistoryPage)}
                  pagination={workHistoryPagination}
                  onPageChange={handleWorkHistoryPageChange}
                />
              </div>
            </div>
          </>
        );

      case 'profile':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Profile Information</h2>
                  <p className="text-sm text-gray-600">Manage your account details and preferences</p>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={handleProfileEdit}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleProfileCancel}
                      disabled={isSavingProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                    >
                      <X className="h-4 w-4" />
                      <span>Cancel</span>
                    </button>
                    <button
                      onClick={handleProfileSave}
                      disabled={isSavingProfile}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{isSavingProfile ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                )}
              </div>

              {profileError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{profileError}</p>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">Profile updated successfully!</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">{user?.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                  <p className="text-gray-900 px-4 py-3 bg-gray-100 rounded-lg">{user?.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Company</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">{user?.company}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                  {isEditingProfile ? (
                    <input
                      type="text"
                      value={profileData.mobile}
                      onChange={(e) => setProfileData({ ...profileData, mobile: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">{user?.mobile}</p>
                  )}
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Security Settings</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">Password</h4>
                        <p className="text-sm text-gray-600">Change your account password</p>
                      </div>
                      <button
                        onClick={() => setShowPasswordModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Lock className="h-4 w-4" />
                        <span>Change Password</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Member Since</label>
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg">
                      {user?.memberSince ? new Date(user.memberSince).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Account Status</label>
                    <p className="text-gray-900 px-4 py-3 bg-gray-50 rounded-lg capitalize">{user?.status || 'Active'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'credits':
        return (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl p-8 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">Current Balance</h2>
                  <p className="text-5xl font-bold text-green-600 mb-1">{(user?.credits || 0).toFixed(2)} credits</p>
                  <p className="text-sm text-gray-600">Total spent: {user?.totalSpent?.toFixed(2) || '0.00'} BDT</p>
                </div>
                <button
                  onClick={() => setShowCreditPurchaseModal(true)}
                  className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 font-bold text-lg shadow-lg transition-all hover:scale-105"
                >
                  Buy Credits
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Credit Information</h3>
              <div className="space-y-4 text-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-gray-700">
                    Credits are used to run automation services. Each service has a different credit cost based on complexity and processing requirements.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-gray-700">
                    You can purchase credits at any time through our secure payment gateway. Credits never expire and can be used for any service.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="text-gray-700">
                    Track your credit usage by service in the Analytics section below to optimize your automation workflow.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Credit Usage Analytics</h3>
              <CreditUsageAnalytics userId={user?.id || ''} />
            </div>
          </div>
        );

      case 'transactions':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Transaction History</h2>
              <p className="text-gray-600">View all your credit purchase transactions and payment history</p>
            </div>
            <TransactionHistory userId={user?.id || ''} />
          </div>
        );

      case 'credentials':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Portal Credentials</h2>
                <p className="text-sm text-gray-600">Manage login credentials for external portals used by automation services</p>
              </div>
              <PortalCredentialsManager userId={user?.id || ''} />
            </div>
          </div>
        );

      case 'credit-history':
        return (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Credit History</h2>
              <p className="text-gray-600">Complete timeline of all credit purchases and usage across services</p>
            </div>
            <CreditHistoryTab userId={user?.id || ''} />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-cyan-50">
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
            notification.type === 'success' ? 'bg-green-500 text-white' :
            notification.type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
          }`}>
            {notification.type === 'success' && <CheckCircle className="h-5 w-5" />}
            {notification.type === 'error' && <AlertCircle className="h-5 w-5" />}
            {notification.type === 'info' && <AlertCircle className="h-5 w-5" />}
            <span className="font-medium">{notification.message}</span>
            <button
              onClick={() => setNotification({ show: false, message: '', type: 'info' })}
              className="ml-2 hover:opacity-75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}
          </h1>
          <p className="text-lg text-gray-600">
            Automate your business processes with ease
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 p-2">
          <div className="flex space-x-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 rounded-xl font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {renderTabContent()}
      </div>


      {showCreditPurchaseModal && (
        <CreditPurchaseModal
          isOpen={showCreditPurchaseModal}
          onClose={() => setShowCreditPurchaseModal(false)}
          userId={user?.id || ''}
          currentCredits={user?.credits || 0}
          onPurchaseSuccess={() => {
            window.location.reload();
          }}
        />
      )}

      {showPasswordModal && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          userId={user?.id || ''}
        />
      )}

      {showCredentialsModal && selectedService && (
        <PortalCredentialsModal
          isOpen={showCredentialsModal}
          onClose={() => {
            setShowCredentialsModal(false);
            if (selectedService && user) {
              axios.get(`/api/credentials/check/bangladesh_bank_exp?userId=${user.id}`)
                .then(response => setHasCredentials(response.data.exists))
                .catch(() => setHasCredentials(false));
            }
          }}
          userId={user?.id || ''}
          portalName="bangladesh_bank_exp"
          portalDisplayName="Bangladesh Bank EXP Portal"
        />
      )}
    </div>
  );
}
