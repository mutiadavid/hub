import { message } from "antd";

export const showAuthSuccessToast = (content) => {
  message.open({
    type: "success",
    content,
    duration: 2.4,
    className: "system-toast system-toast--success",
  });
};

export const showLockToast = (lockedByUserName = "another user") => {
  message.open({
    type: "warning",
    content: `This DCL has been locked by ${lockedByUserName} and cannot be actioned by another person.`,
    duration: 3.2,
    className: "system-toast system-toast--warning",
  });
};