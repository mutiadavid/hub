import React from "react";
/**
 * Queue.jsx - Creator Queue Page
 * Note: This component is currently not actively used in routing.
 * DeferralsPage handles the queue view. This is kept for backwards compatibility.
 */
const Queue = ({ userId }) => {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-semibold">Queue View</h2>
        <p className="text-gray-600">This view is not currently in use.</p>
      </div>
    </div>
  );
};

export default Queue;
