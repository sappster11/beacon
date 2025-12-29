import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { settings as settingsApi } from '../lib/api';
import { useAuth } from './useAuth';

interface BrandingSettings {
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  successColor: string;
  dangerColor: string;
  warningColor: string;
}

const defaultBranding: BrandingSettings = {
  primaryColor: '#3b82f6',
  secondaryColor: '#10b981',
  accentColor: '#8b5cf6',
  successColor: '#10b981',
  dangerColor: '#dc2626',
  warningColor: '#f59e0b',
};

interface BrandingContextType {
  branding: BrandingSettings;
  loading: boolean;
  refresh: () => Promise<void>;
}

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  loading: true,
  refresh: async () => {},
});

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const applyBranding = (settings: BrandingSettings) => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primaryColor);
    root.style.setProperty('--color-secondary', settings.secondaryColor);
    root.style.setProperty('--color-accent', settings.accentColor);
    root.style.setProperty('--color-success', settings.successColor);
    root.style.setProperty('--color-danger', settings.dangerColor);
    root.style.setProperty('--color-warning', settings.warningColor);

    // Also set hover variants (slightly darker)
    root.style.setProperty('--color-primary-hover', adjustColor(settings.primaryColor, -10));
    root.style.setProperty('--color-secondary-hover', adjustColor(settings.secondaryColor, -10));
    root.style.setProperty('--color-accent-hover', adjustColor(settings.accentColor, -10));
  };

  const loadBranding = async () => {
    try {
      const allSettings = await settingsApi.getAll();
      if (allSettings.branding) {
        const brandSettings = {
          ...defaultBranding,
          ...allSettings.branding,
        } as BrandingSettings;
        setBranding(brandSettings);
        applyBranding(brandSettings);
      } else {
        applyBranding(defaultBranding);
      }
    } catch (error) {
      console.error('Failed to load branding:', error);
      applyBranding(defaultBranding);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only load branding if user is logged in
    if (user) {
      loadBranding();
    } else {
      // Apply defaults for logged-out users
      applyBranding(defaultBranding);
      setLoading(false);
    }
  }, [user]);

  return (
    <BrandingContext.Provider value={{ branding, loading, refresh: loadBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export function useBranding() {
  return useContext(BrandingContext);
}

// Helper to darken/lighten a hex color
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0x0000ff) + amt));
  return `#${((1 << 24) | (R << 16) | (G << 8) | B).toString(16).slice(1)}`;
}
