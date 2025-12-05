import { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { Bell, User, Lock, Download, Upload, FileText, Calendar, Users, AlertTriangle, Sun, Moon, Monitor, Link2, Unlink, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../hooks/useTheme';
import { authApi, contactExportApi, calendarApi, googleCalendarApi } from '../services/api';
import type { GoogleCalendarSyncStatus } from '../types';

export function Settings() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [duplicates, setDuplicates] = useState<any[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Calendar state
  const [googleSyncStatus, setGoogleSyncStatus] = useState<GoogleCalendarSyncStatus | null>(null);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Handle Google OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    const tab = searchParams.get('tab');

    if (tab === 'integrations' && code) {
      handleGoogleCallback(code);
      // Clean up URL
      setSearchParams({ tab: 'integrations' });
    }
  }, [searchParams]);

  // Fetch Google sync status
  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchGoogleStatus();
    }
  }, [activeTab]);

  const fetchGoogleStatus = async () => {
    try {
      const status = await googleCalendarApi.getStatus();
      setGoogleSyncStatus(status);
    } catch (error) {
      console.error('Failed to fetch Google Calendar status:', error);
    }
  };

  const handleGoogleCallback = async (code: string) => {
    setIsLoadingGoogle(true);
    try {
      const redirectUri = `${window.location.origin}/settings?tab=integrations`;
      const status = await googleCalendarApi.connect(code, redirectUri);
      setGoogleSyncStatus(status);
      setMessage('Google Calendar connected successfully!');
    } catch (error) {
      setMessage('Failed to connect Google Calendar');
      console.error(error);
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setIsLoadingGoogle(true);
    try {
      const redirectUri = `${window.location.origin}/settings?tab=integrations`;
      const { authUrl } = await googleCalendarApi.getAuthUrl(redirectUri);
      window.location.href = authUrl;
    } catch (error) {
      setMessage('Failed to get authorization URL');
      setIsLoadingGoogle(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    setIsLoadingGoogle(true);
    try {
      await googleCalendarApi.disconnect();
      setGoogleSyncStatus({ connected: false, syncEnabled: false, status: 'NOT_CONNECTED' });
      setMessage('Google Calendar disconnected');
    } catch (error) {
      setMessage('Failed to disconnect');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const triggerGoogleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await googleCalendarApi.triggerSync();
      setMessage(`Synced: ${result.eventsImported} imported, ${result.eventsExported} exported`);
      fetchGoogleStatus();
    } catch (error) {
      setMessage('Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const { register: regProfile, handleSubmit: handleProfile } = useForm({
    defaultValues: {
      name: user?.name || '',
      timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });
  const { register: regPassword, handleSubmit: handlePassword, reset: resetPassword } = useForm();
  const { register: regSettings, handleSubmit: handleSettings } = useForm({
    defaultValues: {
      birthdayReminderDays: user?.settings.birthdayReminderDays || 2,
      anniversaryReminderDays: user?.settings.anniversaryReminderDays || 2,
      defaultFollowupDays: user?.settings.defaultFollowupDays || 7,
      theme: user?.settings.theme || 'system',
    },
  });

  const onProfileSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const updated = await authApi.updateProfile(data);
      updateUser(updated);
      setMessage('Profile updated');
    } catch {
      setMessage('Failed to update');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword);
      setMessage('Password changed');
      resetPassword();
    } catch {
      setMessage('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const onSettingsSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      const updated = await authApi.updateProfile({ settings: data });
      updateUser(updated);
      if (data.theme === 'dark') document.documentElement.classList.add('dark');
      else if (data.theme === 'light') document.documentElement.classList.remove('dark');
      setMessage('Settings saved');
    } catch {
      setMessage('Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  // Export functions
  const exportContactsCsv = async () => {
    setIsLoading(true);
    try {
      const csv = await contactExportApi.exportCsv();
      downloadFile(csv, 'contacts.csv', 'text/csv');
      setMessage('Contacts exported successfully');
    } catch {
      setMessage('Failed to export contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const exportContactsVCard = async () => {
    setIsLoading(true);
    try {
      const vcard = await contactExportApi.exportAllVCard();
      downloadFile(vcard, 'contacts.vcf', 'text/vcard');
      setMessage('Contacts exported as vCard');
    } catch {
      setMessage('Failed to export vCard');
    } finally {
      setIsLoading(false);
    }
  };

  const exportCalendarIcs = async () => {
    setIsLoading(true);
    try {
      const ics = await calendarApi.exportIcs();
      downloadFile(ics, 'calendar.ics', 'text/calendar');
      setMessage('Calendar exported successfully');
    } catch {
      setMessage('Failed to export calendar');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import functions
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const content = await file.text();
      if (file.name.endsWith('.csv')) {
        await contactExportApi.importCsv(content);
        setMessage('Contacts imported successfully');
      } else {
        setMessage('Unsupported file format');
      }
    } catch {
      setMessage('Failed to import file');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Find duplicates
  const findDuplicates = async () => {
    setIsLoading(true);
    try {
      const dups = await contactExportApi.findDuplicates();
      setDuplicates(dups);
      if (dups.length === 0) {
        setMessage('No duplicate contacts found');
      } else {
        setMessage(`Found ${dups.length} potential duplicate groups`);
      }
    } catch {
      setMessage('Failed to check for duplicates');
    } finally {
      setIsLoading(false);
    }
  };

  const mergeDuplicates = async (primaryId: string, mergeIds: string[]) => {
    setIsLoading(true);
    try {
      await contactExportApi.mergeContacts(primaryId, mergeIds);
      setMessage('Contacts merged successfully');
      findDuplicates(); // Refresh
    } catch {
      setMessage('Failed to merge contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'preferences', label: 'Preferences', icon: Bell },
    { id: 'integrations', label: 'Integrations', icon: Link2 },
    { id: 'data', label: 'Data', icon: Download },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[hsl(var(--background))] border-b border-[hsl(var(--border))]">
        <div className="px-4 py-4 lg:px-8">
          <h1 className="text-2xl font-bold">Settings</h1>

          {/* Tabs - scrollable on mobile */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 -mx-4 px-4 lg:mx-0 lg:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMessage('');
            }}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'hover:bg-[hsl(var(--accent))]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 lg:p-8 space-y-6">
      {message && (
        <div className="rounded-lg bg-green-100 p-3 text-sm text-green-800 dark:bg-green-900 dark:text-green-200">
          {message}
        </div>
      )}

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4">
              <Input label="Name" {...regProfile('name')} />
              <Input label="Timezone" {...regProfile('timezone')} />
              <Button type="submit" isLoading={isLoading}>
                Save Profile
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'password' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                {...regPassword('currentPassword')}
              />
              <Input label="New Password" type="password" {...regPassword('newPassword')} />
              <Input
                label="Confirm Password"
                type="password"
                {...regPassword('confirmPassword')}
              />
              <Button type="submit" isLoading={isLoading}>
                Change Password
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <div className="space-y-4">
          {/* Theme Section */}
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <label className="block text-sm font-medium">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === 'light'
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'
                    }`}
                  >
                    <Sun className="h-6 w-6" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'
                    }`}
                  >
                    <Moon className="h-6 w-6" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                      theme === 'system'
                        ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                        : 'border-[hsl(var(--border))] hover:border-[hsl(var(--primary)/0.5)]'
                    }`}
                  >
                    <Monitor className="h-6 w-6" />
                    <span className="text-sm font-medium">System</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reminders Section */}
          <Card>
            <CardHeader>
              <CardTitle>Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettings(onSettingsSubmit)} className="space-y-4">
                <Input
                  label="Birthday Reminder (days before)"
                  type="number"
                  {...regSettings('birthdayReminderDays')}
                />
                <Input
                  label="Anniversary Reminder (days before)"
                  type="number"
                  {...regSettings('anniversaryReminderDays')}
                />
                <Input
                  label="Default Follow-up (days)"
                  type="number"
                  {...regSettings('defaultFollowupDays')}
                />
                <Button type="submit" isLoading={isLoading}>
                  Save Preferences
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-4">
          {/* Google Calendar Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingGoogle ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--primary))]" />
                </div>
              ) : googleSyncStatus?.connected ? (
                <div className="space-y-4">
                  {/* Connected Status */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div className="flex-1">
                      <p className="font-medium text-green-800 dark:text-green-200">Connected</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {googleSyncStatus.primaryCalendarId || 'Primary Calendar'}
                      </p>
                    </div>
                  </div>

                  {/* Sync Status */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--muted))]/50">
                    <div>
                      <p className="text-sm font-medium">Last Synced</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {googleSyncStatus.lastSyncAt
                          ? new Date(googleSyncStatus.lastSyncAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {googleSyncStatus.status === 'SYNCED' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          Synced
                        </span>
                      )}
                      {googleSyncStatus.status === 'SYNC_FAILED' && (
                        <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                          Failed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={triggerGoogleSync}
                      disabled={isSyncing}
                      className="flex-1"
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Sync Now
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={disconnectGoogleCalendar}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Unlink className="h-4 w-4 mr-2" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Not Connected */}
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-[hsl(var(--muted))]/50">
                    <XCircle className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                    <div className="flex-1">
                      <p className="font-medium">Not Connected</p>
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">
                        Connect your Google Calendar to sync events
                      </p>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                    <p className="font-medium text-[hsl(var(--foreground))]">What you'll get:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Two-way sync with Google Calendar</li>
                      <li>Real Google Meet links for video calls</li>
                      <li>Automatic event updates</li>
                    </ul>
                  </div>

                  <Button onClick={connectGoogleCalendar} className="w-full">
                    <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Connect Google Calendar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Future Integrations Placeholder */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Apple Calendar
                <span className="text-xs px-2 py-0.5 rounded bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                  Coming Soon
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Apple Calendar integration will be available in a future update.
                For now, you can export your calendar as ICS from the Data tab.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-4">
          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={exportContactsCsv}
                  isLoading={isLoading}
                  className="justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export Contacts (CSV)
                </Button>
                <Button
                  variant="outline"
                  onClick={exportContactsVCard}
                  isLoading={isLoading}
                  className="justify-start"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Export Contacts (vCard)
                </Button>
                <Button
                  variant="outline"
                  onClick={exportCalendarIcs}
                  isLoading={isLoading}
                  className="justify-start"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Export Calendar (ICS)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Import Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".csv"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                isLoading={isLoading}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Contacts (CSV)
              </Button>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
                CSV should have columns: name, company, emails, phones, birthday, tags
              </p>
            </CardContent>
          </Card>

          {/* Duplicates Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Find Duplicates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" onClick={findDuplicates} isLoading={isLoading}>
                Scan for Duplicates
              </Button>

              {duplicates.length > 0 && (
                <div className="space-y-3 mt-4">
                  {duplicates.map((group, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-[hsl(var(--border))]"
                    >
                      <p className="text-sm font-medium mb-2">
                        Potential duplicates ({group.length} contacts):
                      </p>
                      <div className="space-y-2">
                        {group.map((contact: any, cIdx: number) => (
                          <div
                            key={contact.id}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>
                              {contact.name}
                              {contact.emails?.[0] && (
                                <span className="text-[hsl(var(--muted-foreground))] ml-2">
                                  ({contact.emails[0]})
                                </span>
                              )}
                            </span>
                            {cIdx === 0 ? (
                              <span className="text-xs bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] px-2 py-0.5 rounded">
                                Primary
                              </span>
                            ) : (
                              <button
                                onClick={() =>
                                  mergeDuplicates(
                                    group[0].id,
                                    group.slice(1).map((c: any) => c.id)
                                  )
                                }
                                className="text-xs text-[hsl(var(--primary))] hover:underline"
                              >
                                Merge into Primary
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
}
