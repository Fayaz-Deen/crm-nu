import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Layout } from './components/layout/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyEmail } from './pages/VerifyEmail';
import { Dashboard } from './pages/Dashboard';
import { Contacts } from './pages/Contacts';
import { ContactDetail } from './pages/ContactDetail';
import { Meetings } from './pages/Meetings';
import { Reminders } from './pages/Reminders';
import { Settings } from './pages/Settings';
import SharedWithMe from './pages/SharedWithMe';
import Templates from './pages/Templates';
import { Tasks } from './pages/Tasks';
import { Calendar } from './pages/Calendar';
import { Tags } from './pages/Tags';
import { Groups } from './pages/Groups';
import { useAuthStore } from './store/authStore';
import { ThemeProvider } from './hooks/useTheme';
import { ToastProvider } from './components/ui';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return <div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent" /></div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  const { setLoading } = useAuthStore();

  useEffect(() => {
    setLoading(false);
  }, [setLoading]);

  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/dashboard" />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="contacts/:id" element={<ContactDetail />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="calendar" element={<Calendar />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="reminders" element={<Reminders />} />
              <Route path="tags" element={<Tags />} />
              <Route path="groups" element={<Groups />} />
              <Route path="shared" element={<SharedWithMe />} />
              <Route path="templates" element={<Templates />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
