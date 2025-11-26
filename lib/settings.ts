/**
 * 设置管理模块
 * 处理API配置和示例案例的本地存储
 */

export interface APISettings {
  useCustomAPI: boolean;
  customAPIKey?: string;
  customAPIEndpoint?: string;
  customAPIModel?: string;
}

export interface AppSettings {
  api: APISettings;
  lastUpdated: number;
}

const SETTINGS_KEY = 'nnu-smartwrite-settings';
const DEFAULT_SETTINGS: AppSettings = {
  api: {
    useCustomAPI: false,
  },
  lastUpdated: Date.now(),
};

/**
 * 获取当前设置
 */
export function getSettings(): AppSettings {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return DEFAULT_SETTINGS;
    }
    
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      return DEFAULT_SETTINGS;
    }
    
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * 保存设置
 */
export function saveSettings(settings: AppSettings): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    const toSave = {
      ...settings,
      lastUpdated: Date.now(),
    };
    
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
    return true;
  } catch (error) {
    console.error('Failed to save settings:', error);
    return false;
  }
}

/**
 * 重置设置为默认值
 */
export function resetSettings(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch (error) {
    console.error('Failed to reset settings:', error);
    return false;
  }
}

/**
 * 检查是否使用自定义API
 */
export function isUsingCustomAPI(): boolean {
  const settings = getSettings();
  return settings.api.useCustomAPI && !!settings.api.customAPIKey;
}
