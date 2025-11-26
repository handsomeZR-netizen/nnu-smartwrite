"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { getSettings, saveSettings, resetSettings, type AppSettings } from "@/lib/settings";
import { Settings, Cloud, Key, RefreshCw, Save, RotateCcw, CheckCircle, AlertCircle } from "lucide-react";

export default function SettingsPage() {
  const [settings, setSettings] = React.useState<AppSettings | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [saveMessage, setSaveMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  // 加载设置
  React.useEffect(() => {
    const loaded = getSettings();
    setSettings(loaded);
  }, []);

  // 处理API类型切换
  const handleAPITypeChange = (useCustom: boolean) => {
    if (!settings) return;
    setSettings({
      ...settings,
      api: {
        ...settings.api,
        useCustomAPI: useCustom,
      },
    });
  };

  // 处理自定义API字段变化
  const handleCustomAPIChange = (field: 'customAPIKey' | 'customAPIEndpoint' | 'customAPIModel', value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      api: {
        ...settings.api,
        [field]: value,
      },
    });
  };

  // 保存设置
  const handleSave = () => {
    if (!settings) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    setTimeout(() => {
      const success = saveSettings(settings);
      if (success) {
        setSaveMessage({ type: 'success', text: '设置已保存' });
      } else {
        setSaveMessage({ type: 'error', text: '保存失败，请重试' });
      }
      setIsSaving(false);
      
      // 3秒后清除消息
      setTimeout(() => setSaveMessage(null), 3000);
    }, 500);
  };

  // 重置设置
  const handleReset = () => {
    if (!window.confirm('确定要重置所有设置吗？')) return;
    
    const success = resetSettings();
    if (success) {
      const loaded = getSettings();
      setSettings(loaded);
      setSaveMessage({ type: 'success', text: '设置已重置' });
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage({ type: 'error', text: '重置失败，请重试' });
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen bg-nnu-paper pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center py-16">
            <RefreshCw className="w-12 h-12 text-nnu-green animate-spin mx-auto mb-4" />
            <p className="text-gray-600">加载设置中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nnu-paper pt-24 pb-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* 页面标题 */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-nnu-green" />
            <h1 className="text-3xl md:text-4xl font-bold text-nnu-green">系统设置</h1>
          </div>
          <p className="text-gray-600">配置API和个性化选项</p>
        </header>

        {/* 保存消息 */}
        {saveMessage && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              saveMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
            role="alert"
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        {/* API配置卡片 */}
        <Card className="mb-6 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-nnu-green">
              <Key className="w-5 h-5" />
              API 配置
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* API类型选择 */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">API 类型</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 云端API */}
                <button
                  type="button"
                  onClick={() => handleAPITypeChange(false)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    !settings.api.useCustomAPI
                      ? 'border-nnu-green bg-nnu-green/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Cloud className={`w-6 h-6 mt-1 ${!settings.api.useCustomAPI ? 'text-nnu-green' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">云端 API</span>
                        {!settings.api.useCustomAPI && (
                          <Badge className="bg-nnu-green text-white">当前使用</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">使用平台提供的 DeepSeek API</p>
                      <p className="text-xs text-gray-500 mt-1">无需配置，开箱即用</p>
                    </div>
                  </div>
                </button>

                {/* 自定义API */}
                <button
                  type="button"
                  onClick={() => handleAPITypeChange(true)}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    settings.api.useCustomAPI
                      ? 'border-nnu-coral bg-nnu-coral/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Key className={`w-6 h-6 mt-1 ${settings.api.useCustomAPI ? 'text-nnu-coral' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">自定义 API</span>
                        {settings.api.useCustomAPI && (
                          <Badge className="bg-nnu-coral text-white">当前使用</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">使用自己的 API 密钥</p>
                      <p className="text-xs text-gray-500 mt-1">支持多种格式</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 自定义API配置表单 */}
            {settings.api.useCustomAPI && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key *</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="sk-..."
                    value={settings.api.customAPIKey || ''}
                    onChange={(e) => handleCustomAPIChange('customAPIKey', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    你的 API 密钥将安全存储在本地浏览器中
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">API Endpoint（可选）</Label>
                  <Input
                    id="apiEndpoint"
                    type="url"
                    placeholder="https://api.deepseek.com/v1"
                    value={settings.api.customAPIEndpoint || ''}
                    onChange={(e) => handleCustomAPIChange('customAPIEndpoint', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    留空使用默认地址。可以只填基础 URL（如 https://api.deepseek.com/v1），系统会自动添加 /chat/completions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiModel">模型名称（可选）</Label>
                  <Input
                    id="apiModel"
                    type="text"
                    placeholder="deepseek-chat"
                    value={settings.api.customAPIModel || ''}
                    onChange={(e) => handleCustomAPIChange('customAPIModel', e.target.value)}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    留空使用默认模型 deepseek-chat
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  <p className="font-semibold mb-1">支持的 API 格式：</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>DeepSeek API (推荐)</li>
                    <li>OpenAI 兼容格式</li>
                    <li>其他兼容 Chat Completions 的 API</li>
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            onClick={handleReset}
            variant="outline"
            className="text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            重置设置
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-nnu-green hover:bg-nnu-green/90"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
