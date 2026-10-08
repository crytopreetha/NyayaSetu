import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CitizenRoute, LawyerRoute } from './components/ProtectedRoutes';

// Pages
import { HomePage } from './pages/HomePage';
import { CitizenLoginPage } from './pages/CitizenLoginPage';
import { CitizenRegisterPage } from './pages/CitizenRegisterPage';
import { LawyerLoginPage } from './pages/LawyerLoginPage';
import { LawyerRegisterPage } from './pages/LawyerRegisterPage';
import { CitizenDashboardPage } from './pages/CitizenDashboardPage';
import { LawyerDashboardPage } from './pages/LawyerDashboardPage';
import { CaseDetailPage } from './pages/CaseDetailPage';
import { LawyerCaseDetailPage } from './pages/LawyerCaseDetailPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <Routes>
          {/* ── Public ──────────────────────────────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* ── Citizen auth ─────────────────────────────────────────────── */}
          <Route path="/login" element={<CitizenLoginPage />} />
          <Route path="/register" element={<CitizenRegisterPage />} />

          {/* ── Lawyer auth ───────────────────────────────────────────────── */}
          <Route path="/lawyer/login" element={<LawyerLoginPage />} />
          <Route path="/lawyer/register" element={<LawyerRegisterPage />} />

          {/* ── Citizen protected ─────────────────────────────────────────── */}
          <Route
            path="/citizen/dashboard"
            element={
              <CitizenRoute>
                <CitizenDashboardPage />
              </CitizenRoute>
            }
          />
          <Route
            path="/citizen/cases/:id"
            element={
              <CitizenRoute>
                <CaseDetailPage />
              </CitizenRoute>
            }
          />

          {/* ── Lawyer protected ──────────────────────────────────────────── */}
          <Route
            path="/lawyer/dashboard"
            element={
              <LawyerRoute>
                <LawyerDashboardPage />
              </LawyerRoute>
            }
          />
          <Route
            path="/lawyer/cases/:id"
            element={
              <LawyerRoute>
                <LawyerCaseDetailPage />
              </LawyerRoute>
            }
          />

          {/* ── Catch-all ─────────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
