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
      navigate("/register");
      break;
  }
};