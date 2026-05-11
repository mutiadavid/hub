import React, { useCallback, useEffect, useRef, useState } from "react";
import { Modal } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../api/authSlice";

/** Throttle idle resets so mousemove does not constantly clear/set timers. */
const ACTIVITY_RESET_MS = 1000;

const SessionTimeout = ({ timeoutDuration = 15 * 60 * 1000, warningDuration = 30 * 1000 }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, token } = useSelector((state) => state.auth);
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const isWarningVisibleRef = useRef(false);
  const [countdown, setCountdown] = useState(warningDuration / 1000);
  const lastThrottleResetRef = useRef(0);

  const timeoutMinutes = Math.round(timeoutDuration / 60000);

  useEffect(() => {
    isWarningVisibleRef.current = isWarningVisible;
  }, [isWarningVisible]);

  const showWarning = useCallback(() => {
    setIsWarningVisible(true);
    setCountdown(warningDuration / 1000);

    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [warningDuration]);

  const handleLogout = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsWarningVisible(false);

    dispatch(logout());

    Modal.warning({
      title: "Session Expired",
      content: "You have been logged out due to inactivity.",
      onOk: () => {
        navigate("/login", {
          replace: true,
          state: {
            status: `You were logged out after ${timeoutMinutes} minutes of inactivity.`,
          },
        });
      },
    });
  }, [dispatch, navigate, timeoutMinutes]);

  const resetTimer = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

    warningTimeoutRef.current = setTimeout(showWarning, timeoutDuration - warningDuration);
    timeoutRef.current = setTimeout(handleLogout, timeoutDuration);
  }, [handleLogout, showWarning, timeoutDuration, warningDuration]);

  const handleExtendSession = useCallback(() => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setIsWarningVisible(false);
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    if (!user || !token) {
      return undefined;
    }

    const events = [
      "mousedown",
      "click",
      "scroll",
      "keydown",
      "touchstart",
      "mousemove",
      "visibilitychange",
      "focus",
    ];

    const handleActivity = () => {
      if (document.visibilityState === "hidden") return;
      if (isWarningVisibleRef.current) return;

      const now = Date.now();
      if (now - lastThrottleResetRef.current < ACTIVITY_RESET_MS) return;
      lastThrottleResetRef.current = now;
      resetTimer();
    };

    resetTimer();
    lastThrottleResetRef.current = Date.now();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer, token, user]);

  useEffect(() => {
    if (countdown === 0 && isWarningVisible) {
      handleLogout();
    }
  }, [countdown, handleLogout, isWarningVisible]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!user || !token) {
    return null;
  }

  return (
    <>
      <Modal
        title="Session Timeout Warning"
        open={isWarningVisible}
        onOk={handleExtendSession}
        onCancel={handleLogout}
        okText="Extend Session"
        cancelText="Logout Now"
        maskClosable={false}
        centered
        width={400}
      >
        <div style={{ textAlign: "center", padding: "10px 0" }}>
          <p style={{ fontSize: "14px", marginBottom: "15px" }}>Your session will expire in:</p>
          <div
            style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: countdown <= 10 ? "#ff4d4f" : "#164679",
              margin: "15px 0",
            }}
          >
            {formatTime(countdown)}
          </div>
          <p style={{ fontSize: "13px", color: "#666" }}>
            {countdown <= 10
              ? 'Click "Extend Session" to continue working.'
              : 'Click "Extend Session" to reset the idle timer, or "Logout Now" to sign out.'}
          </p>
        </div>
      </Modal>
    </>
  );
};

export default SessionTimeout;
