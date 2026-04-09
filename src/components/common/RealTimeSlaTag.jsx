import React, { useEffect, useState } from "react";
import { Tag, Tooltip } from "antd";
import dayjs from "dayjs";

const TICK_INTERVAL_MS = 1000;

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

function getSlaPresentation({ slaExpiry, startedAt, now }) {
  if (startedAt) {
    const started = dayjs(startedAt);
    if (started.isValid()) {
      const elapsedMs = Math.max(0, now.diff(started));
      const elapsedText = formatDuration(elapsedMs);
      let style = {
        color: "#0958d9",
        borderColor: "#91caff",
        backgroundColor: "#e6f4ff",
      };
      let title = `Elapsed since ${started.format("DD MMM YYYY HH:mm:ss")}`;

      if (slaExpiry) {
        const expiry = dayjs(slaExpiry);
        if (expiry.isValid()) {
          const diffMs = expiry.diff(now);
          const absText = formatDuration(Math.abs(diffMs));

          if (diffMs < 0) {
            style = {
              color: "#cf1322",
              borderColor: "#ffa39e",
              backgroundColor: "#fff1f0",
            };
            title = `Elapsed ${elapsedText}. Overdue by ${absText}. SLA expiry: ${expiry.format("DD MMM YYYY HH:mm:ss")}`;
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

            title = `Elapsed ${elapsedText}. Time remaining ${absText}. SLA expiry: ${expiry.format("DD MMM YYYY HH:mm:ss")}`;
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
    const expiry = dayjs(slaExpiry);
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
}) => {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs());
    }, TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  const presentation = getSlaPresentation({ slaExpiry, startedAt, now });

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