import React from "react";
import { Tag, Tooltip } from "antd";
import { formatTagText, getOutlinedTagStyle } from "./tagStyleUtils";

const truncateLabel = (value, maxChars) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw.length <= maxChars) return raw;
  return `${raw.slice(0, Math.max(maxChars - 2, 1))}..`;
};

const UniformTag = ({
  text,
  children,
  color = "default",
  icon,
  maxChars = 16,
  maxWidth = 116,
  style = {},
  uppercase = false,
}) => {
  const rawText = formatTagText(text ?? children);
  const displayText = truncateLabel(rawText, maxChars);
  const isTruncated = displayText !== rawText;

  const tagNode = (
    <Tag
      icon={icon}
      style={{
        ...getOutlinedTagStyle(color, {
          fontSize: isTruncated ? 10 : 11,
          minHeight: 24,
          lineHeight: "22px",
        }),
        maxWidth,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textTransform: uppercase ? "uppercase" : "none",
        ...style,
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
        {displayText}
      </span>
    </Tag>
  );

  if (isTruncated) {
    return <Tooltip title={rawText}>{tagNode}</Tooltip>;
  }

  return tagNode;
};

export default UniformTag;