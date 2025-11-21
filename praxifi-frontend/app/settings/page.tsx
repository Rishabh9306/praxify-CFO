'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Moon, Sun, Monitor, Save, Key, User } from 'lucide-react';
import { PersonaMode } from '@/lib/types';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [defaultPersona, setDefaultPersona] = useState<PersonaMode>('finance_guardian');
  const [userName, setUserName] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Load settings from localStorage
    const storedApiKey = localStorage.getItem('praxifi-api-key') || '';
    const storedPersona = localStorage.getItem('praxifi-default-persona') as PersonaMode || 'finance_guardian';
    const storedUserName = localStorage.getItem('praxifi-user-name') || '';
    
    setApiKey(storedApiKey);
    setDefaultPersona(storedPersona);
    setUserName(storedUserName);
  }, []);

  const handleSaveSettings = () => {
    // Save to localStorage
    localStorage.setItem('praxifi-api-key', apiKey);
    localStorage.setItem('praxifi-default-persona', defaultPersona);
    localStorage.setItem('praxifi-user-name', userName);
    
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all local data? This will remove all session history.')) {
      localStorage.removeItem('praxifi-cfo-sessions');
      alert('Local data cleared. Session history has been removed.');
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pt-20 pb-20">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Settings</h1>
          <p className="text-muted-foreground text-lg">
            Configure your Praxifi CFO experience
          </p>
        </div>

        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize the visual theme of the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => setTheme('light')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === 'light' ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Sun className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Light</p>
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === 'dark' ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Moon className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">Dark</p>
                  </button>
                  <button
                    onClick={() => setTheme('system')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      theme === 'system' ? 'border-primary' : 'border-border'
                    }`}
                  >
                    <Monitor className="h-6 w-6 mx-auto mb-2" />
                    <p className="text-sm font-medium">System</p>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>Set your default analysis preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Display Name (Optional)</Label>
                <Input
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultPersona">Default Persona Mode</Label>
                <Select value={defaultPersona} onValueChange={(v) => setDefaultPersona(v as PersonaMode)}>
                  <SelectTrigger id="defaultPersona">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="finance_guardian">
                      Finance Guardian - Conservative, risk-focused
                    </SelectItem>
                    <SelectItem value="financial_storyteller">
                      Financial Storyteller - Narrative-driven
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* API Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Configure API keys (if not managed on backend)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Google Gemini API Key (Optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="apiKey"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key"
                  />
                  <Button
                    size="sm"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? 'Hide' : 'Show'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: For production use, API keys should be managed securely on the backend via environment variables
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage your local application data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm mb-2">Local Storage Usage:</p>
                <p className="text-xs text-muted-foreground">
                  Session history and preferences are stored locally in your browser
                </p>
              </div>
              <Button
                onClick={handleClearData}
                className="w-full"
              >
                Clear All Local Data
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex gap-4">
            <Button
              onClick={handleSaveSettings}
              className="flex-1 gap-2"
            >
              <Save className="h-4 w-4" />
              {saved ? 'Settings Saved!' : 'Save Settings'}
            </Button>
          </div>

          {/* Info */}
          <Card>
            <CardHeader>
              <CardTitle>About Settings</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>• Settings are stored locally in your browser</p>
              <p>• Theme preference syncs across tabs</p>
              <p>• API keys are optional and should preferably be managed server-side</p>
              <p>• Default persona is applied when creating new analyses</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
