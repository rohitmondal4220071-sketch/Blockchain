"use client";

import { useEffect, useRef, useState } from "react";
import { CONFIG } from "@/lib/config";

/**
 * Reusable cinematic Earth/space background used globally across the app
 * (landing, auth modal, dashboard, feature pages). Rendered once in the root
 * layout so it is always present on first paint — no flat-color flash.
 *
 * Performance: the CSS gradient base paints INSTANTLY (it matches the <body>
 * fallback in globals.css). The heavy background video is NOT requested during
 * first load — it is mounted only after the page goes idle (requestIdleCallback
 * / delayed timeout), so it never competes with first paint or blocks rendering.
 *
 * Layering:
 *   - z-0  : space gradient base (always painted) + deferred video.
 *   - z-[1]: dark readability overlay.
 *   - z-10+: page content (rendered by pages above this component).
 */
export function EarthBackground() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mountVideo, setMountVideo] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  // Defer mounting the video until the browser is idle, so first paint is the
  // (instant) gradient — the video is a progressive enhancement only.
  useEffect(() => {
    let cancelled = false;
    const start = () => {
      if (!cancelled) setMountVideo(true);
    };

    type IdleWindow = Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
    };
    const w = window as IdleWindow;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(start, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(start, 1200);
    }

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  // Once the video is mounted, give it a window to load; if it stalls, give up
  // gracefully (the gradient already looks like deep space).
  useEffect(() => {
    if (!mountVideo) return;
    const timer = window.setTimeout(() => {
      setVideoReady((ready) => {
        if (!ready) setVideoFailed(true);
        return ready;
      });
    }, CONFIG.videoTimeoutMs);
    return () => window.clearTimeout(timer);
  }, [mountVideo]);

  return (
    <>
      {/* z-0: background base + (deferred) video */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Space gradient base (instant, guaranteed — never black) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 90% at 50% -10%, #243044 0%, #131c28 38%, #0a111b 70%, #060a12 100%)",
          }}
        />
        {/* Earth glow arc near the bottom (steel-blue) */}
        <div
          className="absolute inset-x-0 bottom-[-30%] h-[75%]"
          style={{
            background:
              "radial-gradient(60% 100% at 50% 100%, rgba(110,145,180,0.40) 0%, rgba(60,85,115,0.20) 35%, rgba(20,30,45,0) 70%)",
          }}
        />
        {/* Soft starfield dots (shimmer while video loads) */}
        <div
          className={`absolute inset-0 ${videoReady ? "opacity-50" : "opacity-50 bg-shimmer"}`}
          style={{
            backgroundImage:
              "radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.55) 0, transparent 100%), radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.45) 0, transparent 100%), radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.4) 0, transparent 100%), radial-gradient(1px 1px at 85% 60%, rgba(255,255,255,0.5) 0, transparent 100%), radial-gradient(1px 1px at 55% 45%, rgba(255,255,255,0.35) 0, transparent 100%)",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Deferred, best-effort video — only requested after the page is idle. */}
        {mountVideo && !videoFailed && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            onCanPlay={() => setVideoReady(true)}
            onPlaying={() => setVideoReady(true)}
            onError={() => setVideoFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              videoReady ? "opacity-40" : "opacity-0"
            }`}
            style={{ mixBlendMode: "screen" }}
          >
            <source src={CONFIG.videoUrl} type="video/mp4" />
          </video>
        )}
      </div>

      {/* z-[1]: dark readability overlay (lighter than before so the scene
          reads as deep space, not flat black) */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(6,10,18,0.30) 0%, rgba(6,10,18,0.48) 65%, rgba(3,5,10,0.62) 100%)",
        }}
      />
    </>
  );
}
