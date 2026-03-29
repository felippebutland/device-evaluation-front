import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';

// Public Pages
import { SubmissionForm } from '@/components/forms/SubmissionForm';
import { TrackSubmissionPage } from '@/pages/TrackSubmissionPage';

// Auth Pages
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

// User Pages
import { DashboardPage } from '@/pages/DashboardPage';
import { MySubmissionsPage } from '@/pages/MySubmissionsPage';
import { SubmitDevicePage } from '@/pages/SubmitDevicePage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { DeviceManagementPage } from '@/pages/DeviceManagementPage';
import { EvaluationsPage } from '@/pages/EvaluationsPage';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { SettingsPage } from '@/pages/SettingsPage';

// Components
import { AdminRoute } from '@/components/AdminRoute';

import './globals.css';
import './style.css';
import {Footer} from "./src/components/layout/Footer";
import {ProtectedRoute} from "./src/components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-white">

            <main className="flex-1 bg-white">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<SubmissionForm />} />
                {/*<Route path="/catalog" element={<Navigate to="/" replace />} />*/}
                {/*<Route path="/track" element={<TrackSubmissionPage />} />*/}

                {/*/!* Auth Routes *!/*/}
                <Route path="/login" element={<LoginPage />} />
                {/*<Route path="/register" element={<RegisterPage />} />*/}

                {/*/!* Protected User Routes *!/*/}
                {/*<Route*/}
                {/*  path="/dashboard"*/}
                {/*  element={*/}
                {/*    <ProtectedRoute>*/}
                {/*      <DashboardPage />*/}
                {/*    </ProtectedRoute>*/}
                {/*  }*/}
                {/*/>*/}
                {/*<Route*/}
                {/*  path="/my-submissions"*/}
                {/*  element={*/}
                {/*    <ProtectedRoute>*/}
                {/*      <MySubmissionsPage />*/}
                {/*    </ProtectedRoute>*/}
                {/*  }*/}
                {/*/>*/}
                {/*<Route*/}
                {/*  path="/submit-device"*/}
                {/*  element={*/}
                {/*    <ProtectedRoute>*/}
                {/*      <SubmitDevicePage />*/}
                {/*    </ProtectedRoute>*/}
                {/*  }*/}
                {/*/>*/}

                {/* Admin Routes */}
                {/*<Route*/}
                {/*  path="/admin"*/}
                {/*  element={*/}
                {/*    <AdminRoute>*/}
                {/*      <AdminDashboardPage />*/}
                {/*    </AdminRoute>*/}
                {/*  }*/}
                {/*/>*/}
                <Route
                  path="/admin/devices"
                  element={
                    <ProtectedRoute>
                      <DeviceManagementPage />
                    </ProtectedRoute>
                  }
                />
                {/*<Route*/}
                {/*  path="/admin/evaluations"*/}
                {/*  element={*/}
                {/*    <AdminRoute>*/}
                {/*      <EvaluationsPage />*/}
                {/*    </AdminRoute>*/}
                {/*  }*/}
                {/*/>*/}
                {/*<Route*/}
                {/*  path="/admin/users"*/}
                {/*  element={*/}
                {/*    <AdminRoute>*/}
                {/*      <UserManagementPage />*/}
                {/*    </AdminRoute>*/}
                {/*  }*/}
                {/*/>*/}
                {/*<Route*/}
                {/*  path="/admin/settings"*/}
                {/*  element={*/}
                {/*    <AdminRoute>*/}
                {/*      <SettingsPage />*/}
                {/*    </AdminRoute>*/}
                {/*  }*/}
                {/*/>*/}

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            <Footer />
          </div>

          <ToastContainer />
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
