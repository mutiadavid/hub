import React, { useEffect, useState } from "react";
import { Button, Tag } from "antd";
import { ClockCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import {
  PRIMARY_BLUE,
  ACCENT_LIME,
  SECONDARY_PURPLE,
} from "../../utils/colors";

const STORAGE_NAMESPACE = "banking-sla-timer";
const TICK_INTERVAL_MS = 1000;

const toValidDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const getStorage = (persistence) => {
  if (typeof window === "undefined") return null;
  return persistence === "session" ? window.sessionStorage : window.localStorage;
};

const getStorageKey = (storageKey) => `${STORAGE_NAMESPACE}:${storageKey}`;

const readStoredState = (storageKey, persistence) => {
  const storage = getStorage(persistence);
  if (!storage || !storageKey) return {};

  try {
    const raw = storage.getItem(getStorageKey(storageKey));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const writeStoredState = (storageKey, persistence, nextState) => {
  const storage = getStorage(persistence);
  if (!storage || !storageKey) return;

  try {
    storage.setItem(getStorageKey(storageKey), JSON.stringify(nextState));
  } catch {
    // Ignore storage quota and serialization issues.
  }
};

const isWeekend = (date) => {
  const day = date.getDay();
  return day === 0 || day === 6;
};

const setTimeOnDate = (date, hour) => {
  const next = new Date(date);
  next.setHours(hour, 0, 0, 0);
  return next;
};

const moveToNextBusinessDay = (date, businessStartHour, excludeWeekends) => {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  next.setHours(businessStartHour, 0, 0, 0);

  if (!excludeWeekends) {
    return next;
  }

  while (isWeekend(next)) {
    next.setDate(next.getDate() + 1);
    next.setHours(businessStartHour, 0, 0, 0);
  }

  return next;
};

const calculateBusinessMilliseconds = (
  start,
  end,
  { businessStartHour, businessEndHour, excludeWeekends },
) => {
  const startDate = toValidDate(start);
  const endDate = toValidDate(end);

  if (!startDate || !endDate || endDate <= startDate) {
    return 0;
  }

  let total = 0;
  let cursor = new Date(startDate);

  while (cursor < endDate) {
    if (excludeWeekends && isWeekend(cursor)) {
      cursor = moveToNextBusinessDay(cursor, businessStartHour, excludeWeekends);
      continue;
    }

    const businessStart = setTimeOnDate(cursor, businessStartHour);
    const businessEnd = setTimeOnDate(cursor, businessEndHour);
    const intervalStart = new Date(Math.max(cursor.getTime(), businessStart.getTime()));
    const intervalEnd = new Date(Math.min(endDate.getTime(), businessEnd.getTime()));

    if (intervalEnd > intervalStart) {
      total += intervalEnd.getTime() - intervalStart.getTime();
    }

    cursor = moveToNextBusinessDay(cursor, businessStartHour, excludeWeekends);
  }

  return total;
};

const formatDuration = (milliseconds) => {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
};

const getStatusConfig = ({
  now,
  completed,
  businessStartHour,
  businessEndHour,
  excludeWeekends,
}) => {
  if (completed) {
    return { label: "Completed", color: "success" };
  }

  if (excludeWeekends && isWeekend(now)) {
    return { label: "Paused (Outside Business Hours)", color: "warning" };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const businessStartMinutes = businessStartHour * 60;
  const businessEndMinutes = businessEndHour * 60;
  const isWithinBusinessWindow =
    currentMinutes >= businessStartMinutes && currentMinutes < businessEndMinutes;

  return isWithinBusinessWindow
    ? { label: "Running", color: "processing" }
    : { label: "Paused (Outside Business Hours)", color: "warning" };
};

const BankingSlaTimer = ({
  storageKey,
  startedAt,
  completed = false,
  completedAt,
  slaExpiry,
  excludeWeekends = true,
  businessStartHour = 8,
  businessEndHour = 17,
  persistence = "local",
  showReset = true,
  onReset,
  style,
}) => {
  const [persistedState, setPersistedState] = useState(() =>
    readStoredState(storageKey, persistence),
  );
  const [now, setNow] = useState(() => new Date());

  const normalizedStartedAt = startedAt || persistedState.startedAt || new Date().toISOString();
  const normalizedCompletedAt = completed
    ? completedAt || persistedState.completedAt || new Date().toISOString()
    : null;

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!storageKey || !normalizedStartedAt) return;

    const nextState = {
      startedAt: normalizedStartedAt,
      completedAt: persistedState.completedAt || null,
    };

    const hasChanged =
      persistedState.startedAt !== nextState.startedAt ||
      persistedState.completedAt !== nextState.completedAt;

    if (!hasChanged) return;

    setPersistedState(nextState);
    writeStoredState(storageKey, persistence, nextState);
  }, [storageKey, persistence, persistedState.completedAt, persistedState.startedAt, normalizedStartedAt]);

  useEffect(() => {
    if (!storageKey || !completed || !normalizedCompletedAt) return;

    const nextState = {
      startedAt: normalizedStartedAt,
      completedAt: normalizedCompletedAt,
    };

    const hasChanged =
      persistedState.startedAt !== nextState.startedAt ||
      persistedState.completedAt !== nextState.completedAt;

    if (!hasChanged) return;

    setPersistedState(nextState);
    writeStoredState(storageKey, persistence, nextState);
  }, [
    completed,
    normalizedCompletedAt,
    normalizedStartedAt,
    persistence,
    persistedState.completedAt,
    storageKey,
  ]);

  const handleReset = () => {
    const resetAt = new Date().toISOString();
    const nextState = {
      startedAt: resetAt,
      completedAt: null,
    };

    setPersistedState(nextState);
    setNow(new Date());
    writeStoredState(storageKey, persistence, nextState);
    onReset?.(nextState);
  };

  const elapsedBusinessMilliseconds = calculateBusinessMilliseconds(
    normalizedStartedAt,
    normalizedCompletedAt || now,
    {
      businessStartHour,
      businessEndHour,
      excludeWeekends,
    },
  );

  const status = getStatusConfig({
    now,
    completed: Boolean(normalizedCompletedAt),
    businessStartHour,
    businessEndHour,
    excludeWeekends,
  });

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        backgroundColor: "#fff",
        borderRadius: 4,
        border: `1px solid ${PRIMARY_BLUE}22`,
        fontSize: 13,
        ...style,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: PRIMARY_BLUE,
              fontWeight: 700,
              marginBottom: 6,
            }}
          >
            <ClockCircleOutlined />
            <span>Banking SLA Timer</span>
          </div>
          <div
            style={{
              fontSize: 24,
              lineHeight: 1.1,
              color: PRIMARY_BLUE,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            {formatDuration(elapsedBusinessMilliseconds)}
          </div>
          <Tag color={status.color} style={{ marginInlineEnd: 0, marginBottom: 8 }}>
            {status.label}
          </Tag>
        </div>

        {showReset && !normalizedCompletedAt && (
          <Button size="small" icon={<ReloadOutlined />} onClick={handleReset}>
            Reset
          </Button>
        )}
      </div>

      <div style={{ color: "#666", display: "grid", gap: 4 }}>
        <div>
          <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>Business Window: </span>
          <span>
            {dayjs().hour(businessStartHour).minute(0).format("HH:mm")} - {dayjs().hour(businessEndHour).minute(0).format("HH:mm")}
          </span>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>Started: </span>
          <span>{dayjs(normalizedStartedAt).format("DD MMM YYYY HH:mm:ss")}</span>
        </div>
        {slaExpiry && (
          <div>
            <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>SLA Expiry: </span>
            <span>{dayjs(slaExpiry).format("DD MMM YYYY HH:mm:ss")}</span>
          </div>
        )}
        <div>
          <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>Weekend Rule: </span>
          <span>{excludeWeekends ? "Weekends excluded" : "Weekends included"}</span>
        </div>
        {normalizedCompletedAt && (
          <div>
            <span style={{ fontWeight: 600, color: SECONDARY_PURPLE }}>Completed: </span>
            <span>{dayjs(normalizedCompletedAt).format("DD MMM YYYY HH:mm:ss")}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankingSlaTimer;