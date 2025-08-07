import express from 'express';
import settingsService from '../services/SettingsService.js';

const router = express.Router();

// GET /api/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await settingsService.loadSettings();
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load settings',
      error: error.message
    });
  }
});

// GET /api/settings/datatable - Get datatable settings
router.get('/datatable', async (req, res) => {
  try {
    const settings = await settingsService.loadSettings();
    res.json({
      success: true,
      data: settingsService.getDatatableSettings()
    });
  } catch (error) {
    console.error('Error getting datatable settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load datatable settings',
      error: error.message
    });
  }
});

// PUT /api/settings - Update all settings
router.put('/', async (req, res) => {
  try {
    const newSettings = req.body;
    const updatedSettings = await settingsService.saveSettings(newSettings);
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message
    });
  }
});

// PUT /api/settings/datatable - Update datatable settings
router.put('/datatable', async (req, res) => {
  try {
    const datatableSettings = req.body;
    const updatedSettings = await settingsService.updateDatatableSettings(datatableSettings);
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Datatable settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating datatable settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update datatable settings',
      error: error.message
    });
  }
});

// POST /api/settings/reset - Reset settings to defaults
router.post('/reset', async (req, res) => {
  try {
    const defaultSettings = await settingsService.resetToDefaults();
    res.json({
      success: true,
      data: defaultSettings,
      message: 'Settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset settings',
      error: error.message
    });
  }
});

export default router;
