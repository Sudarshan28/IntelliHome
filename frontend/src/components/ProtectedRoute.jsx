import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-dark-900 text-brand-500">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
