import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useSelector((state) => state.auth);

  // Not logged in → redirect to login
  if (!user) return <Navigate to="/login" />;

  // If role-based protection is applied
  if (role && user.user.role !== role) return <Navigate to="/login" />;

  return children;
};

export default ProtectedRoute;
