import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import Home from './pages/Home';
import Companies from './pages/Companies';
import Apply from './pages/Apply';
import Cart from './pages/Cart';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EmployerManageCompanies from './pages/EmployerManageCompanies';
import EmployerPostCompanyPage from './pages/EmployerPostCompanyPage';
import EmployerManageRequisitions from './pages/EmployerManageRequisitions';
import EmployerPostRequisitionPage from './pages/EmployerPostRequisitionPage';
import EmployerCandidatePipelinePage from './pages/EmployerCandidatePipelinePage';
import AdminMasterSetupPage from './pages/AdminMasterSetupPage';
import UserProfilePage from './pages/UserProfilePage';
import SavedRequisitions from './pages/SavedRequisitions';
import NotFoundPage from './pages/NotFoundPage';
import AccessDeniedPage from './pages/AccessDeniedPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster richColors position="top-right" closeButton visibleToasts={3} duration={3000} />
        <div className="flex flex-col min-h-screen bg-slate-50">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Clerk SSO Callback Route */}
              <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback signUpForceRedirectUrl="/homepage" signInForceRedirectUrl="/homepage" />} />

              {/* Public Routes */}
              <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Route>

              {/* General Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Navigate to="/homepage" replace />} />
                <Route path="/homepage" element={<Home />} />
                <Route path="/profile" element={<UserProfilePage />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/requisitions" element={<EmployerManageRequisitions />} />
                <Route path="/saved-requisitions" element={<SavedRequisitions />} />
                <Route path="/saved-jobs" element={<SavedRequisitions />} />
                <Route path="/apply" element={<Apply />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/access-denied" element={<AccessDeniedPage />} />
              </Route>

              {/* Employer / Admin Job Requisition & Pipeline Routes */}
              <Route element={<ProtectedRoute allowedRoles={['employer', 'admin']} />}>
                <Route path="/post-requisition" element={<EmployerPostRequisitionPage />} />
                <Route path="/candidate-pipeline" element={<EmployerCandidatePipelinePage />} />
                <Route path="/kanban" element={<Navigate to="/candidate-pipeline" replace />} />
              </Route>

              {/* Admin Only Master Setup & Company Profile Management Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/manage-companies" element={<EmployerManageCompanies />} />
                <Route path="/post-company" element={<EmployerPostCompanyPage />} />
                <Route path="/admin/master-setup" element={<AdminMasterSetupPage />} />
              </Route>

              {/* Catch-all 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
