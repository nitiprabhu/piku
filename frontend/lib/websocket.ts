"use client";
import { useState, useEffect, useRef } from "react";

export interface JobProgress {
  event: string;
  step: string;
  percent: number;
  video_url?: string;
  thumbnail_url?: string;
  viral_score?: number;
  error?: string;
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const WS_URL =
      process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8005";
    const ws = new WebSocket(`${WS_URL}/api/v1/ws/${jobId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setProgress({ event: "connected", step: "connecting", percent: 0 });
    };

    ws.onmessage = (event) => {
      try {
        const data: JobProgress = JSON.parse(event.data);
        setProgress(data);
      } catch {}
    };

    ws.onerror = () => {
      setProgress({
        event: "failed",
        step: "error",
        percent: 0,
        error: "WebSocket connection lost",
      });
    };

    ws.onclose = () => {
      // If not already completed/failed, mark error
      setProgress((prev) => {
        if (prev && ["completed", "failed"].includes(prev.event)) return prev;
        return prev;
      });
    };

    return () => {
      ws.close();
    };
  }, [jobId]);

  return progress;
}
