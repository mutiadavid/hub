import React, { useEffect, useState } from "react";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { Button, Tooltip } from "antd";
import { BellOutlined } from "@ant-design/icons";
import deferralApi from "../../service/deferralApi";

export default function PendingDeferrals({ deferrals = [], onGeneratePDF }) {
  const [hiddenMap, setHiddenMap] = useState({});

  useEffect(() => {
    // Load hidden reminders from localStorage on mount
    const map = {};
    (deferrals || []).forEach((d) => {
      const id = d._id || d.id || d.Id || d.deferralNumber;
      const key = `remind_block_${id}`;
      const ts = parseInt(localStorage.getItem(key) || "0", 10);
      if (ts && Date.now() < ts) map[id] = ts;
    });
    setHiddenMap(map);
  }, [deferrals]);

  const handleRemind = async (deferral) => {
    const id =
      deferral._id || deferral.id || deferral.Id || deferral.deferralNumber;
    const key = `remind_block_${id}`;

    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      const token = stored?.token;
      const actorName = stored?.user?.name || stored?.user?.email || "System";

      await deferralApi.sendReminderAndLog(id, token, {
        actorName,
        text: `${actorName} initiated a reminder.`,
      });

      // Hide button for 1 hour
      const expiry = Date.now() + 60 * 60 * 1000;
      localStorage.setItem(key, String(expiry));
      setHiddenMap((m) => ({ ...m, [id]: expiry }));

      // optional user feedback
      try {
        window.toast && window.toast("Reminder sent");
      } catch {}
    } catch (e) {
      console.error("Failed to send reminder", e);
      try {
        window.toast && window.toast("Reminder failed");
      } catch {}
    }
  };
  if (!deferrals.length) {
    return (
      <div className="p-4 text-gray-500 text-center">
        No pending deferrals available.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {deferrals.map((deferral, index) => (
        <div
          key={index}
          className="bg-white border rounded-lg shadow hover:shadow-md p-4 cursor-pointer transition relative"
          onClick={() => onGeneratePDF(deferral)}
        >
          {/* Top row: Deferral No | Business Name */}
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-bold text-gray-800">
              {deferral.deferralNumber}
            </h3>
            <span className="text-sm text-[#1E2B5F] font-semibold">
              {deferral.businessName}
            </span>
          </div>

          {/* Customer Name */}
          <p className="text-xs text-gray-500 mb-1">{deferral.customerName}</p>

          {/* Current Approver */}
          <p className="text-xs text-gray-400 mb-1">
            Current Approver:{" "}
            <span className="text-gray-700">
              {typeof deferral.currentApprover === "string"
                ? deferral.currentApprover
                : (deferral.currentApprover &&
                    (deferral.currentApprover.name ||
                      deferral.currentApprover.email ||
                      String(deferral.currentApprover))) ||
                  "N/A"}
            </span>
          </p>

          {/* Status */}
          <p
            className={`text-xs font-semibold ${
              deferral.status === "Pending"
                ? "text-yellow-600"
                : deferral.status === "Approved"
                  ? "text-green-600"
                  : "text-red-600"
            }`}
          >
            {deferral.status}
          </p>

          {/* PDF icon */}
          <div className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <HiOutlineDocumentDownload />
          </div>
          {/* Remind button - hidden for 1 hour after use per-deferral (localStorage) */}
          {!hiddenMap[
            deferral._id ||
              deferral.id ||
              deferral.Id ||
              deferral.deferralNumber
          ] && (
            <div className="absolute bottom-4 left-4">
              <Tooltip title="Send reminder to approver">
                <Button
                  size="small"
                  icon={<BellOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemind(deferral);
                  }}
                />
              </Tooltip>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
