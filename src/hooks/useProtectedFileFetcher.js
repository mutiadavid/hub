import { useCallback } from "react";
import { useLazyFetchFileQuery } from "../api/protectedUploadsApi";

export default function useProtectedFileFetcher() {
  const [trigger, { isLoading }] = useLazyFetchFileQuery();

  const openFile = useCallback(async (fileUrl) => {
    if (!fileUrl) return;
    const res = await trigger(fileUrl);
    if (res.error) throw res.error;
    const blob = res.data;
    const blobUrl = URL.createObjectURL(blob);
    const w = window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    return w;
  }, [trigger]);

  const downloadFile = useCallback(async (fileUrl, fileName) => {
    if (!fileUrl) return;
    const res = await trigger(fileUrl);
    if (res.error) throw res.error;
    const blob = res.data;
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    if (fileName) link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  }, [trigger]);

  return {
    openFile,
    downloadFile,
    loading: Boolean(isLoading),
  };
}
