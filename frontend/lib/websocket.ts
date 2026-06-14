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

const DONE = new Set(["completed", "failed"]);
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyProgress = (data: JobProgress) => {
    setProgress((prev) => {
      // Don't overwrite a terminal state with an earlier event
      if (prev && DONE.has(prev.event) && !DONE.has(data.event)) return prev;
      return data;
    });
  };

  const pollStatus = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
      const res = await fetch(`${API_URL}/api/v1/generate/status/${jobId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const raw = await res.json();
      // HTTP response uses "status" field; normalize to "event" for JobProgress
      const data: JobProgress = {
        event: raw.event || raw.status || raw.step || "progress",
        step: raw.step || raw.status || "progress",
        percent: raw.percent ?? 0,
        video_url: raw.video_url,
        thumbnail_url: raw.thumbnail_url,
        viral_score: raw.viral_score,
        error: raw.error,
      };
      applyProgress(data);
      if (DONE.has(data.event)) {
        if (pollRef.current) clearInterval(pollRef.current);
      }
    } catch {}
  };

  useEffect(() => {
    if (!jobId) return;

    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8005";
    const ws = new WebSocket(`${WS_URL}/api/v1/ws/${jobId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setProgress({ event: "connected", step: "connecting", percent: 0 });
      // Poll immediately on open — catch jobs that completed before WS subscribed
      pollStatus();
    };

    ws.onmessage = (event) => {
      try {
        const data: JobProgress = JSON.parse(event.data);
        applyProgress(data);
      } catch {}
    };

    ws.onerror = () => {
      // WS failed — fall back to HTTP polling
      pollRef.current = setInterval(pollStatus, 3000);
    };

    ws.onclose = () => {
      setProgress((prev) => {
        if (prev && DONE.has(prev.event)) return prev;
        return prev;
      });
    };

    // Fallback: poll every 4s regardless, in case WS misses events
    pollRef.current = setInterval(pollStatus, 4000);

    return () => {
      ws.close();
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobId]); // eslint-disable-line react-hooks/exhaustive-deps

  return progress;
}
