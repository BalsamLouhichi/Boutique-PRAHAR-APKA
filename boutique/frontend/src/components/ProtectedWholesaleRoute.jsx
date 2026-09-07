import { Navigate } from 'react-router-dom';

export default function ProtectedWholesaleRoute({ children }) {
  const token = localStorage.getItem('wholesale_token');
  if (!token) return <Navigate to="/gros/connexion" replace />;
  return children;
}
