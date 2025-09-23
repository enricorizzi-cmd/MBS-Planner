import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/ui/loading-spinner';
import { PushNotificationPrompt } from './components/PushNotificationPrompt';
import { InstallPrompt } from './components/InstallPrompt';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { StudentsPage } from './pages/anagrafiche/StudentsPage';
import { CompaniesPage } from './pages/anagrafiche/CompaniesPage';
import { SupervisorsPage } from './pages/anagrafiche/SupervisorsPage';
import { ListPage } from './pages/programmazione/ListPage';
import { DispositionPage } from './pages/programmazione/DispositionPage';
import { CalendarPage } from './pages/programmazione/CalendarPage';
import { UsersPage } from './pages/impostazioni/UsersPage';
import { SettingsPage } from './pages/impostazioni/SettingsPage';
import { ImportPage } from './pages/impostazioni/ImportPage';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <>
      <DashboardLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Anagrafiche */}
          <Route path="/anagrafiche/studenti" element={<StudentsPage />} />
          <Route path="/anagrafiche/aziende" element={<CompaniesPage />} />
          <Route path="/anagrafiche/supervisori" element={<SupervisorsPage />} />
          
          {/* Programmazione */}
          <Route path="/programmazione/lista" element={<ListPage />} />
          <Route path="/programmazione/disposizione" element={<DispositionPage />} />
          <Route path="/programmazione/calendario" element={<CalendarPage />} />
          
          {/* Impostazioni */}
          <Route path="/impostazioni/utenti" element={<UsersPage />} />
          <Route path="/impostazioni/settings" element={<SettingsPage />} />
          <Route path="/impostazioni/import" element={<ImportPage />} />
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </DashboardLayout>
      
      {/* PWA Components */}
      <PushNotificationPrompt />
      <InstallPrompt />
    </>
  );
}

export default App;
