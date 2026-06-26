import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LocationProvider } from './context/LocationContext';
import { ThemeProvider } from './context/ThemeContext';

// Dummy imports for screens (these will be built later)
const Landing = () => <div>Landing Screen (Public)</div>;
const Login = () => <div>Login Screen</div>;
const Register = () => <div>Register Screen</div>;
const Forgot = () => <div>Forgot Password Screen</div>;
const Dashboard = () => <div>Dashboard Screen (Protected)</div>;
const Search = () => <div>Search Hospitals</div>;
const HospitalDetail = () => <div>Hospital Detail</div>;
const PrescriptionCenter = () => <div>Prescriptions</div>;
const ReportCenter = () => <div>Medical Reports</div>;
const HealthTrends = () => <div>Health Trends</div>;
const Profile = () => <div>Profile</div>;

// ProtectedRoute Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<Forgot />} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/hospital/:id" element={<ProtectedRoute><HospitalDetail /></ProtectedRoute>} />
      <Route path="/prescriptions" element={<ProtectedRoute><PrescriptionCenter /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><ReportCenter /></ProtectedRoute>} />
      <Route path="/health-trends" element={<ProtectedRoute><HealthTrends /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LocationProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-white dark:bg-gray-900 text-black dark:text-white transition-colors duration-300">
              <AppRoutes />
              {/* Global Modals & Overlays will go here */}
            </div>
          </BrowserRouter>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
