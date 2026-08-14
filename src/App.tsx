import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import HomeRedirect from './pages/HomeRedirect';
import CustomerDashboard from './pages/CustomerDashboard';
import DriverDashboard from './pages/DriverDashboard';
import Profile from './pages/Profile';
import BookRide from './pages/customer/BookRide';
import Payments from './pages/Payments';
import TrackRide from './pages/customer/TrackRide';
import History from './pages/History';
import AdminDashboard from './pages/admin/AdminDashboard';

function StaticPage({ title, text }: { title: string; text: string }) {
  const paragraphs = text.split(/\n{2,}/).filter(Boolean);
  return (
    <div className="mx-auto max-w-3xl px-4 py-20">
      <h1 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <div className="mt-6 space-y-4 text-start leading-relaxed text-slate-600">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const { t } = useTranslation();
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/how-it-works" element={<StaticPage title={t('static.howItWorks.title')} text={t('static.howItWorks.text')} />} />
            <Route path="/support" element={<StaticPage title={t('static.support.title')} text={t('static.support.text')} />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/home" element={<HomeRedirect />} />
            <Route
              path="/customer"
              element={
                <ProtectedRoute roles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book"
              element={
                <ProtectedRoute roles={['customer']}>
                  <BookRide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute roles={['customer']}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/track/:id"
              element={
                <ProtectedRoute roles={['customer', 'driver']}>
                  <TrackRide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute roles={['customer', 'driver']}>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/driver"
              element={
                <ProtectedRoute roles={['driver']}>
                  <DriverDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute roles={['customer', 'driver']}>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
