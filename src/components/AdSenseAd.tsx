import React, { useEffect, useState } from 'react';

interface AdSenseAdProps {
  placement: string;
  style?: React.CSSProperties;
  className?: string;
}

interface AdSettings {
  id: string;
  ad_client_id: string;
  ad_slot_id: string;
  ad_format: string;
  full_width_responsive: boolean;
  enabled: boolean;
  placement_location: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdSenseAd({
  placement,
  style = {},
  className = ''
}: AdSenseAdProps) {
  const [adSettings, setAdSettings] = useState<AdSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdSettings = async () => {
      try {
        const response = await fetch(`/api/ads/settings/${placement}`);
        const data = await response.json();

        if (data.success && data.setting) {
          setAdSettings(data.setting);
        }
      } catch (error) {
        console.error('Error fetching ad settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdSettings();
  }, [placement]);

  useEffect(() => {
    if (!adSettings || !adSettings.enabled) return;

    try {
      // Load AdSense script if not already loaded
      if (!document.querySelector(`script[src*="adsbygoogle.js?client=${adSettings.ad_client_id}"]`)) {
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSettings.ad_client_id}`;
        script.crossOrigin = 'anonymous';
        document.head.appendChild(script);
      }

      // Initialize ad after a small delay to ensure script is loaded
      const timer = setTimeout(() => {
        try {
          if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
            window.adsbygoogle.push({});
          }
        } catch (e) {
          console.error('AdSense push error:', e);
        }
      }, 100);

      return () => clearTimeout(timer);
    } catch (error) {
      console.error('AdSense error:', error);
    }
  }, [adSettings]);

  // Don't render if loading, no settings, or ad is disabled
  if (loading || !adSettings || !adSettings.enabled) {
    return null;
  }

  return (
    <div className={`adsense-container my-6 ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adSettings.ad_client_id}
        data-ad-slot={adSettings.ad_slot_id}
        data-ad-format={adSettings.ad_format}
        data-full-width-responsive={adSettings.full_width_responsive.toString()}
      />
    </div>
  );
}