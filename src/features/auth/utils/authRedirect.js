import { showAuthSuccessToast } from "../../../utils/authToast";

export const redirectUserByRole = ({ navigate, role, successMessage }) => {
  const roleStr = role?.toLowerCase();

  if (successMessage) {
    showAuthSuccessToast(successMessage);
  }

  switch (roleStr) {
    case "admin":
      navigate("/admin");
      break;
    case "cochecker":
      navigate("/cochecker");
      break;
    case "rm":
      navigate("/rm");
      break;
    case "cocreator":
      navigate("/cocreator");
      break;
    case "approver":
      navigate("/approver");
      break;
    default:
      console.warn("Unknown role in redirectUserByRole:", roleStr, "Original role:", role);
      // Let's redirect to admin by default so ProtectedRoute can handle it and show authorization error,
      // or if it's completely missing, at least it doesn't blindly go to /register
      navigate("/admin");
      break;
  }
};