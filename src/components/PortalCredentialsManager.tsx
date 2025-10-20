import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, AlertCircle, Settings, Plus } from 'lucide-react';
import PortalCredentialsModal from './PortalCredentialsModal';
import axios from 'axios';

interface PortalConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  services: string[];
}

const PORTAL_CONFIGS: PortalConfig[] = [
  {
    id: 'bangladesh_bank_exp',
    name: 'bangladesh_bank_exp',
    displayName: 'Bangladesh Bank EXP Portal',
    description: 'Required for EXP search and management services',
    services: ['exp-search', 'exp-issue', 'exp-correction', 'exp-duplicate-reporting']
  },
  {
    id: 'epb_export_tracker',
    name: 'epb_export_tracker',
    displayName: 'EPB Export Tracker Portal',
    description: 'Required for REX/SOO form submission and export tracking',
    services: ['rex-soo-submission']
  }
];

interface PortalCredentialsManagerProps {
  userId: string;
}

interface CredentialStatus {
  portalName: string;
  configured: boolean;
  lastUpdated?: string;
}

export default function PortalCredentialsManager({ userId }: PortalCredentialsManagerProps) {
  const [credentialStatuses, setCredentialStatuses] = useState<CredentialStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPortal, setSelectedPortal] = useState<PortalConfig | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadCredentialStatuses();
  }, [userId]);

  const loadCredentialStatuses = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/api/credentials/user/${userId}`);
      if (response.data.success) {
        const configuredPortals = response.data.data;

        const statuses: CredentialStatus[] = PORTAL_CONFIGS.map(config => {
          const existing = configuredPortals.find((c: any) => c.portal_name === config.name);
          return {
            portalName: config.name,
            configured: !!existing,
            lastUpdated: existing?.updated_at
          };
        });

        setCredentialStatuses(statuses);
      }
    } catch (error) {
      console.error('Error loading credential statuses:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigureCredentials = (portal: PortalConfig) => {
    setSelectedPortal(portal);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPortal(null);
    loadCredentialStatuses();
  };

  const getCredentialStatus = (portalName: string) => {
    return credentialStatuses.find(s => s.portalName === portalName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Key className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">About Portal Credentials</h3>
            <p className="text-sm text-blue-800">
              Some automation services require login credentials to third-party portals.
              Your credentials are encrypted and stored securely, used only for automation, and never shared.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {PORTAL_CONFIGS.map((portal) => {
          const status = getCredentialStatus(portal.name);
          const isConfigured = status?.configured || false;

          return (
            <div
              key={portal.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isConfigured ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Key className={`h-5 w-5 ${isConfigured ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{portal.displayName}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        {isConfigured ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600 font-medium">Configured</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-orange-600 font-medium">Not Configured</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3">{portal.description}</p>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs font-medium text-gray-500">Used by:</span>
                    <div className="flex flex-wrap gap-1">
                      {portal.services.map((service) => (
                        <span
                          key={service}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {status?.lastUpdated && (
                    <p className="text-xs text-gray-500">
                      Last updated: {new Date(status.lastUpdated).toLocaleString()}
                    </p>
                  )}
                </div>

                <div className="ml-4">
                  <button
                    onClick={() => handleConfigureCredentials(portal)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      isConfigured
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {isConfigured ? (
                      <>
                        <Settings className="h-4 w-4" />
                        <span>Update</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Configure</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && selectedPortal && (
        <PortalCredentialsModal
          isOpen={showModal}
          onClose={handleCloseModal}
          userId={userId}
          portalName={selectedPortal.name}
          portalDisplayName={selectedPortal.displayName}
        />
      )}
    </div>
  );
}
