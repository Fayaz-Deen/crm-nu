import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Bell, User, Lock, Download, Upload, FileText, Calendar, Users, AlertTriangle } from 'lucide-react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Select } from '../components/ui';
import { useAuthStore } from '../store/authStore';
import { authApi, contactExportApi, calendarApi } from '../services/api';

export function Settings() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [duplicates, setDuplicates] = useState<any[][]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    { id: 'data', label: 'Data', icon: Download },
  ];

  return (
    <div className="space-y-6 pb-20">
      <h1 className="text-2xl font-bold">Settings</h1>

      {/* Tabs - scrollable on mobile */}
      <div className="flex gap-2 border-b border-[hsl(var(--border))] pb-2 overflow-x-auto">
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
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSettings(onSettingsSubmit)} className="space-y-4">
              <Select
                label="Theme"
                options={[
                  { value: 'light', label: 'Light' },
                  { value: 'dark', label: 'Dark' },
                  { value: 'system', label: 'System' },
                ]}
                {...regSettings('theme')}
              />
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
  );
}
