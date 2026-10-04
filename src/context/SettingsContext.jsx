import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsService, DEFAULT_SETTINGS } from '../services/settingsService';

const DEFAULT_SETTINGS_CONTEXT = {
  settings: DEFAULT_SETTINGS,
  loading: true,
  updateSettings: async (val) => val,
  reloadSettings: async () => {},
};

const SettingsContext = createContext(DEFAULT_SETTINGS_CONTEXT);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const data = await settingsService.getSettings();
      setSettings(data);
    } catch (e) {
      console.warn("Failed to load settings:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (newSettings) => {
    const updated = await settingsService.saveSettings(newSettings);
    setSettings(updated);
    return updated;
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSettings, reloadSettings: loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  return context || DEFAULT_SETTINGS_CONTEXT;
};
