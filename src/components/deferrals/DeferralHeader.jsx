import React from "react";

export default function DeferralHeader() {
  return (
    <div className="bg-[#0A1A44] text-white p-4 rounded-md mb-6 shadow-md flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Deferral Management</h1>
        <p className="text-sm text-green-200">
          Manage all customer deferrals efficiently
        </p>
      </div>
      <button
        className="bg-white text-[#0A1A44] px-4 py-2 rounded-md font-semibold hover:bg-gray-100 transition"
        onClick={() => window.location.reload()}
      >
        Refresh
      </button>
    </div>
  );
}
