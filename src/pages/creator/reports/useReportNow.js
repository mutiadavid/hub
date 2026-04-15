import { useEffect, useState } from "react";
import dayjs from "dayjs";

const REPORT_TICK_INTERVAL_MS = 1000;

export default function useReportNow() {
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs());
    }, REPORT_TICK_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, []);

  return now;
}