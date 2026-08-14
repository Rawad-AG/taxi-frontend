import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';

export default function HomeRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate('/');
    else if (user.role === 'driver') navigate('/driver');
    else if (user.role === 'admin') navigate('/admin');
    else navigate('/customer');
  }, [user, loading, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-10 w-10" />
    </div>
  );
}
