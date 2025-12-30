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

// Check if dark mode is active
function isDarkMode(): boolean {
  return document.documentElement.classList.contains('dark');
}

// Get luminance of a hex color (0-1 scale, higher = brighter)
function getLuminance(hex: string): number {
  const rgb = parseInt(hex.replace('#', ''), 16);
  const r = ((rgb >> 16) & 0xff) / 255;
  const g = ((rgb >> 8) & 0xff) / 255;
  const b = (rgb & 0xff) / 255;
  // Relative luminance formula
  const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Lighten a color to ensure visibility in dark mode
function ensureVisibleInDarkMode(hex: string, minLuminance = 0.2): string {
  let luminance = getLuminance(hex);
  if (luminance >= minLuminance) return hex;

  // Progressively lighten until we reach minimum luminance
  let color = hex;
  let iterations = 0;
  while (luminance < minLuminance && iterations < 20) {
    color = adjustColor(color, 15);
    luminance = getLuminance(color);
    iterations++;
  }
  return color;
}

// Apply branding CSS variables
function applyBrandingToDOM(settings: BrandingSettings) {
  const root = document.documentElement;
  const dark = isDarkMode();

  // In dark mode, ensure brand colors are visible (lighten if too dark)
  const primary = dark ? ensureVisibleInDarkMode(settings.primaryColor) : settings.primaryColor;
  const secondary = dark ? ensureVisibleInDarkMode(settings.secondaryColor) : settings.secondaryColor;
  const accent = dark ? ensureVisibleInDarkMode(settings.accentColor) : settings.accentColor;
  const success = dark ? ensureVisibleInDarkMode(settings.successColor) : settings.successColor;
  const danger = dark ? ensureVisibleInDarkMode(settings.dangerColor) : settings.dangerColor;
  const warning = dark ? ensureVisibleInDarkMode(settings.warningColor) : settings.warningColor;

  root.style.setProperty('--color-primary', primary);
  root.style.setProperty('--color-secondary', secondary);
  root.style.setProperty('--color-accent', accent);
  root.style.setProperty('--color-success', success);
  root.style.setProperty('--color-danger', danger);
  root.style.setProperty('--color-warning', warning);

  // Also set hover variants (slightly darker/lighter depending on mode)
  const hoverAdjust = dark ? 15 : -10;
  root.style.setProperty('--color-primary-hover', adjustColor(primary, hoverAdjust));
  root.style.setProperty('--color-secondary-hover', adjustColor(secondary, hoverAdjust));
  root.style.setProperty('--color-accent-hover', adjustColor(accent, hoverAdjust));
}

// Store current branding for dark mode toggle re-application
let currentBranding: BrandingSettings = defaultBranding;

// Apply default branding immediately on module load (before React renders)
(function applyDefaultBrandingImmediately() {
  applyBrandingToDOM(defaultBranding);
})();

export function BrandingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(defaultBranding);
  const [loading, setLoading] = useState(true);

  const applyBranding = (settings: BrandingSettings) => {
    currentBranding = settings;
    applyBrandingToDOM(settings);
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

  // Re-apply branding when dark mode changes
  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          applyBrandingToDOM(currentBranding);
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

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
