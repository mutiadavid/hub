import { message } from "antd";
import { toast } from "react-toastify";

const buildToastOptions = (variant, duration = 3200) => ({
  position: "top-right",
  autoClose: duration,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  className: `ncba-toast ncba-toast--${variant}`,
  progressClassName: "ncba-toast__progress",
});

export const showSuccessToast = (content, duration = 2400) => {
  return toast.success(content, buildToastOptions("success", duration));
};

export const showWarningToast = (content, duration = 3200) => {
  return toast.warning(content, buildToastOptions("warning", duration));
};

export const showInfoToast = (content, duration = 2400) => {
  return toast.info(content, buildToastOptions("info", duration));
};

export const showAuthSuccessToast = (content) => {
  showSuccessToast(content, 2400);
};

export const showLockToast = (lockedByUserName = "another user") => {
  message.open({
    type: "warning",
    content: `This DCL has been locked by ${lockedByUserName} and cannot be actioned by another person.`,
    duration: 3.2,
    className: "system-toast system-toast--warning",
  });
};

export const showErrorToast = (content, duration = 3.2) => {
  toast.error(content, buildToastOptions("error", duration * 1000));
};