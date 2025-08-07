import { useState, useEffect, useCallback } from 'react';

// Hook untuk mengelola settings dari settings.json
export const useSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default settings fallback
  const defaultSettings = {
    datatable: {
      defaultVisibleColumns: [
        "name", "found", "position", "company", 
        "location", "bio", "scrapedAt", "actions"
      ],
      sensor: {
        enableCompanySensor: true,
        enableBioSensor: true,
        enableLocationSensor: true,
        sensorChar: "●",
        defaultSensorMode: true
      },
      pagination: {
        defaultPageSize: 10,
        pageSizeOptions: [5, 10, 20, 30, 40, 50]
      },
      export: {
        includeHeaders: true,
        dateFormat: "YYYY-MM-DD",
        filenameTemplate: "{title}_{date}.csv"
      }
    },
    ui: {
      theme: "system",
      compactMode: false,
      showTooltips: true
    },
    scraping: {
      defaultDelay: 2000,
      maxRetries: 3,
      timeout: 30000
    }
  };

  // Load settings from API
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/settings');
      
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.status}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
      } else {
        throw new Error(result.message || 'Failed to load settings');
      }
      setError(null);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError(err.message);
      // Use default settings as fallback
      setSettings(defaultSettings);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save settings via API
  const saveSettings = useCallback(async (newSettings) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings)
      });
      
      const result = await response.json();
      if (result.success) {
        setSettings(result.data);
        return true;
      } else {
        throw new Error(result.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err.message);
      return false;
    }
  }, []);

  // Update specific section of settings via API
  const updateSettings = useCallback(async (section, updates) => {
    if (section === 'datatable') {
      try {
        const response = await fetch('/api/settings/datatable', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates)
        });
        
        const result = await response.json();
        if (result.success) {
          setSettings(prev => ({
            ...prev,
            datatable: result.data
          }));
          return true;
        } else {
          throw new Error(result.message || 'Failed to update datatable settings');
        }
      } catch (err) {
        console.error('Error updating datatable settings:', err);
        setError(err.message);
        return false;
      }
    } else {
      // For other sections, use general update
      if (!settings) return false;
      
      const newSettings = {
        ...settings,
        [section]: {
          ...settings[section],
          ...updates
        }
      };
      
      return await saveSettings(newSettings);
    }
  }, [settings, saveSettings]);

  // Get datatable settings
  const getDatatableSettings = useCallback(() => {
    return settings?.datatable || defaultSettings.datatable;
  }, [settings]);

  // Get UI settings
  const getUISettings = useCallback(() => {
    return settings?.ui || defaultSettings.ui;
  }, [settings]);

  // Get scraping settings
  const getScrapingSettings = useCallback(() => {
    return settings?.scraping || defaultSettings.scraping;
  }, [settings]);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings: settings || defaultSettings,
    loading,
    error,
    loadSettings,
    saveSettings,
    updateSettings,
    getDatatableSettings,
    getUISettings,
    getScrapingSettings
  };
};

// Hook khusus untuk datatable settings
export const useDatatableSettings = () => {
  const { settings, updateSettings, getDatatableSettings } = useSettings();
  
  const datatableSettings = getDatatableSettings();
  
  const updateDatatableSettings = useCallback(async (updates) => {
    return await updateSettings('datatable', updates);
  }, [updateSettings]);

  return {
    datatableSettings,
    updateDatatableSettings,
    defaultVisibleColumns: datatableSettings.defaultVisibleColumns,
    sensorSettings: datatableSettings.sensor,
    paginationSettings: datatableSettings.pagination,
    exportSettings: datatableSettings.export
  };
};

export default useSettings;
