import React, { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import dayjs from "dayjs";

const TICK_INTERVAL_MS = 1000;
const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17;
const BUSINESS_HOURS_PER_DAY = BUSINESS_END_HOUR - BUSINESS_START_HOUR;

function parseServerDate(value) {
  if (!value) {
    return dayjs.invalid();
  }

  if (typeof value === "string") {
    const trimmedValue = value.trim();
    const hasExplicitTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmedValue);
    const normalizedValue = hasExplicitTimezone ? trimmedValue : `${trimmedValue}Z`;
    return dayjs(normalizedValue);
  }

  return dayjs(value);
}

function formatDuration(diffMs) {
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }

  return `${seconds}s`;
}

function isWeekend(moment) {
  const day = moment.day();
  return day === 0 || day === 6;
}

function isWithinBusinessHours(moment, {
  businessStartHour = BUSINESS_START_HOUR,
  businessEndHour = BUSINESS_END_HOUR,
  excludeWeekends = true,
} = {}) {
  if (excludeWeekends && isWeekend(moment)) {
    return false;
  }

  const hour = moment.hour();
  return hour >= businessStartHour && hour < businessEndHour;
}

function calculateBusinessMilliseconds(started, ended, {
  businessStartHour = BUSINESS_START_HOUR,
  businessEndHour = BUSINESS_END_HOUR,
  excludeWeekends = true,
} = {}) {
  if (!started?.isValid?.() || !ended?.isValid?.() || !ended.isAfter(started)) {
    return 0;
  }

  let cursor = started.clone();
  let totalMs = 0;

  while (cursor.isBefore(ended)) {
    if (excludeWeekends && isWeekend(cursor)) {
      cursor = cursor.add(1, "day").startOf("day").hour(businessStartHour);
      continue;
    }

    if (cursor.hour() < businessStartHour) {
      cursor = cursor.hour(businessStartHour).minute(0).second(0).millisecond(0);
    } else if (cursor.hour() >= businessEndHour) {
      cursor = cursor.add(1, "day").startOf("day").hour(businessStartHour);
      continue;
    }

    const endOfBusinessDay = cursor
      .clone()
      .hour(businessEndHour)
      .minute(0)
      .second(0)
      .millisecond(0);
    const intervalEnd = ended.isBefore(endOfBusinessDay) ? ended : endOfBusinessDay;

    if (intervalEnd.isAfter(cursor)) {
      totalMs += intervalEnd.diff(cursor);
      cursor = intervalEnd;
    }

    if (cursor.isBefore(ended)) {
      cursor = cursor.add(1, "day").startOf("day").hour(businessStartHour);
    }
  }

  return totalMs;
}

function formatBusinessDuration(diffMs) {
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60000));
  const businessDays = Math.floor(totalMinutes / (BUSINESS_HOURS_PER_DAY * 60));
  const remainingMinutes = totalMinutes % (BUSINESS_HOURS_PER_DAY * 60);
  const hours = Math.floor(remainingMinutes / 60);
  const minutes = remainingMinutes % 60;

  if (businessDays > 0) {
    return hours > 0 ? `${businessDays}d ${hours}h` : `${businessDays}d`;
  }

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return "0m";
}

function getSlaPresentation({
  slaExpiry,
  startedAt,
  now,
  businessHoursOnly = false,
  businessStartHour = BUSINESS_START_HOUR,
  businessEndHour = BUSINESS_END_HOUR,
  excludeWeekends = true,
}) {
  if (startedAt) {
    const started = parseServerDate(startedAt);
    if (started.isValid()) {
      const elapsedMs = businessHoursOnly
        ? calculateBusinessMilliseconds(started, now, {
            businessStartHour,
            businessEndHour,
            excludeWeekends,
          })
        : Math.max(0, now.diff(started));
      const elapsedText = businessHoursOnly
        ? formatBusinessDuration(elapsedMs)
        : formatDuration(elapsedMs);
      const pausedOutsideBusinessHours =
        businessHoursOnly && !isWithinBusinessHours(now, {
          businessStartHour,
          businessEndHour,
          excludeWeekends,
        });
      let style = {
        color: "#0958d9",
        borderColor: "#91caff",
        backgroundColor: "#e6f4ff",
      };
      let title = businessHoursOnly
        ? `Working time elapsed since ${started.format("DD MMM YYYY HH:mm:ss")}`
        : `Elapsed since ${started.format("DD MMM YYYY HH:mm:ss")}`;

      if (pausedOutsideBusinessHours) {
        style = {
          color: "#ad6800",
          borderColor: "#ffe58f",
          backgroundColor: "#fffbe6",
        };
        title = `${title}. Paused outside business hours (8am-5pm, Monday-Friday).`;
      }

      if (slaExpiry) {
        const expiry = parseServerDate(slaExpiry);
        if (expiry.isValid()) {
          const diffMs = expiry.diff(now);
          const absText = formatDuration(Math.abs(diffMs));

          if (diffMs < 0) {
            style = {
              color: "#cf1322",
              borderColor: "#ffa39e",
              backgroundColor: "#fff1f0",
            };
            title = `${businessHoursOnly ? "Working time elapsed" : "Elapsed"} ${elapsedText}. Overdue by ${absText}. SLA expiry: ${expiry.format("DD MMM YYYY HH:mm:ss")}`;
          } else {
            const hoursLeft = expiry.diff(now, "hour", true);
            if (hoursLeft <= 24) {
              style = {
                color: "#d46b08",
                borderColor: "#ffd591",
                backgroundColor: "#fff7e6",
              };
            } else if (hoursLeft <= 72) {
              style = {
                color: "#ad6800",
                borderColor: "#ffe58f",
                backgroundColor: "#fffbe6",
              };
            } else {
              style = {
                color: "#389e0d",
                borderColor: "#b7eb8f",
                backgroundColor: "#f6ffed",
              };
            }

            title = `${businessHoursOnly ? "Working time elapsed" : "Elapsed"} ${elapsedText}. Time remaining ${absText}. SLA expiry: ${expiry.format("DD MMM YYYY HH:mm:ss")}`;
          }
        }
      }

      return {
        text: elapsedText,
        title,
        style,
      };
    }
  }

  if (slaExpiry) {
    const expiry = parseServerDate(slaExpiry);
    if (!expiry.isValid()) {
      return {
        text: "Invalid",
        title: "Invalid SLA expiry date",
        style: {
          color: "#666",
          borderColor: "#d9d9d9",
          backgroundColor: "#fff",
        },
      };
    }

    const diffMs = expiry.diff(now);
    const absText = formatDuration(Math.abs(diffMs));

    if (diffMs < 0) {
      return {
        text: `-${absText}`,
        title: `Overdue by ${absText}. SLA expiry: ${expiry.format("DD MMM YYYY HH:mm:ss")}`,
        style: {
          color: "#cf1322",
          borderColor: "#ffa39e",
          backgroundColor: "#fff1f0",
        },
      };
    }

    return {
      text: absText,
      title: `Time remaining ${absText}. SLA expiry: ${expiry.format("DD MMM YYYY HH:mm:ss")}`,
      style: {
        color: "#389e0d",
        borderColor: "#b7eb8f",
        backgroundColor: "#f6ffed",
      },
    };
  }

  return null;
}

const RealTimeSlaTag = ({
  slaExpiry,
  startedAt,
  emptyLabel = "N/A",
  minWidth = 64,
  fontSize = 11,
  displayStyle = "tag",
  businessHoursOnly = false,
  businessStartHour = BUSINESS_START_HOUR,
  businessEndHour = BUSINESS_END_HOUR,
  excludeWeekends = true,
}) => {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs());
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const presentation = getSlaPresentation({
    slaExpiry,
    startedAt,
    now,
    businessHoursOnly,
    businessStartHour,
    businessEndHour,
    excludeWeekends,
  });

  if (!presentation) {
    return <div style={{ fontSize, color: "#999" }}>{emptyLabel}</div>;
  }

  if (displayStyle === "text") {
    return (
      <Tooltip title={presentation.title}>
        <span
          style={{
            display: "inline-block",
            minWidth,
            textAlign: "center",
            fontWeight: 600,
            fontSize,
            color: presentation.style.color,
          }}
        >
          {presentation.text}
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={presentation.title}>
      <Tag
        style={{
          marginInlineEnd: 0,
          minWidth,
          textAlign: "center",
          fontWeight: 700,
          fontSize,
          ...presentation.style,
        }}
      >
        {presentation.text}
      </Tag>
    </Tooltip>
  );
};

export default RealTimeSlaTag;