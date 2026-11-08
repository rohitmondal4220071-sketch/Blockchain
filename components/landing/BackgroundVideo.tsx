"use client";

import { useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";

type VideoStatus = "loading" | "playing" | "failed";

/**
 * Full-viewport looping background video at z-0 with a 5s timeout + error
 * fallback to a solid grayscale background (Requirements 1.1–1.10, 16.2).
 */
export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [status, setStatus] = useState<VideoStatus>("loading");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus((prev) => (prev === "playing" ? prev : "failed"));
    }, CONFIG.videoTimeoutMs);
    return () => window.clearTimeout(timer);
  }, []);

  if (status === "failed") {
    return (
      <div
        aria-hidden="true"
        className="fixed inset-0 z-0 bg-[hsl(0_0%_10%)]"
      />
    );
  }

  return (
    <video
      ref={videoRef}
      aria-hidden="true"
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster=""
      onCanPlay={() => setStatus("playing")}
      onPlaying={() => setStatus("playing")}
      onError={() => setStatus("failed")}
      className="fixed inset-0 z-0 h-full w-full object-cover"
    >
      <source src={CONFIG.videoUrl} type="video/mp4" />
    </video>
  );
}
