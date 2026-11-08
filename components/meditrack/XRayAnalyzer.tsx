"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Bone, Camera, Loader2, ScanLine, Upload, X } from "lucide-react";
import { storageService, type XRayAnalysis } from "@/lib/storage";
import {
  classifyBodyPart,
  detectBodyRegion,
  loadImage,
  looksLikeXray,
  validateImageFile,
  XRAY_BODY_PARTS,
  type BoundingBox,
  type XRayResult,
} from "@/lib/xray";
import { GlassButton, GlassCard, SectionTitle } from "./ui";

function dataUrlToBase64(dataUrl: string): { base64: string; mimeType: string } {
  const [meta, data] = dataUrl.split(",");
  const mimeType = meta.match(/data:(.*?);/)?.[1] ?? "image/png";
  return { base64: data ?? "", mimeType };
}

function isValidBox(b: unknown): b is BoundingBox {
  if (!b || typeof b !== "object") return false;
  const r = b as Record<string, unknown>;
  return ["x", "y", "width", "height"].every((k) => typeof r[k] === "number");
}

export function XRayAnalyzer() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<XRayResult | null>(null);
  const [history, setHistory] = useState<XRayAnalysis[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    setHistory(storageService.getXRayAnalyses());
  }, []);

  // Draw image + green bounding box whenever a result is ready.
  useEffect(() => {
    if (!result || !imageSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    loadImage(imageSrc)
      .then((img) => {
        const maxW = 640;
        const scale = Math.min(1, maxW / img.naturalWidth);
        canvas.width = img.naturalWidth * scale;
        canvas.height = img.naturalHeight * scale;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const bx = result.box.x * canvas.width;
        const by = result.box.y * canvas.height;
        const bw = result.box.width * canvas.width;
        const bh = result.box.height * canvas.height;

        ctx.lineWidth = Math.max(2, canvas.width * 0.006);
        ctx.strokeStyle = "#22c55e";
        ctx.shadowColor = "rgba(34,197,94,0.7)";
        ctx.shadowBlur = 14;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur = 0;

        const label = `${result.bodyPart} · ${result.confidence}%`;
        ctx.font = `${Math.max(12, canvas.width * 0.03)}px Poppins, sans-serif`;
        const padding = 6;
        const textW = ctx.measureText(label).width;
        const chipH = Math.max(20, canvas.width * 0.045);
        const chipY = Math.max(0, by - chipH - 4);
        ctx.fillStyle = "rgba(34,197,94,0.9)";
        ctx.fillRect(bx, chipY, textW + padding * 2, chipH);
        ctx.fillStyle = "#04060a";
        ctx.textBaseline = "middle";
        ctx.fillText(label, bx + padding, chipY + chipH / 2);
      })
      .catch(() => {
        /* canvas draw is best-effort; result text still shows */
      });
  }, [result, imageSrc]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    const validation = validateImageFile(file);
    if (!validation.ok) {
      setError(validation.error ?? "Invalid file.");
      return;
    }
    setFileName(file!.name);
    setResult(null);
    const reader = new FileReader();
    reader.onloadend = () => setImageSrc(reader.result as string);
    reader.onerror = () => setError("Could not read the file. Please try another image.");
    reader.readAsDataURL(file!);
  };

  const analyze = async () => {
    if (!imageSrc) {
      setError("No file selected. Please upload an X-ray image.");
      return;
    }
    setError(null);
    setIsProcessing(true);
    cancelledRef.current = false;

    try {
      // 1. Load + validate the image can be decoded.
      const img = await loadImage(imageSrc);
      if (cancelledRef.current) return;

      const { base64, mimeType } = dataUrlToBase64(imageSrc);

      // 2. Ask the AI route to both verify it's an X-ray AND classify it.
      let aiResult: XRayResult | null = null;
      let aiSaysNotXray = false;
      try {
        const res = await fetch("/api/xray-analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType }),
        });
        const data = (await res.json()) as {
          available: boolean;
          result?: {
            isXray?: boolean;
            bodyPart?: string;
            confidence?: number;
            boundingBox?: unknown;
            explanation?: string;
          };
        };
        if (data.available && data.result && !cancelledRef.current) {
          const r = data.result;
          if (r.isXray === false) {
            aiSaysNotXray = true;
          } else {
            const detection = detectBodyRegion(img);
            const aiPart =
              r.bodyPart && (XRAY_BODY_PARTS as readonly string[]).includes(r.bodyPart)
                ? r.bodyPart
                : "Other";
            aiResult = {
              bodyPart: aiPart,
              confidence:
                typeof r.confidence === "number"
                  ? Math.max(0, Math.min(100, Math.round(r.confidence)))
                  : 80,
              box: isValidBox(r.boundingBox) ? r.boundingBox : detection.box,
              boxFound: isValidBox(r.boundingBox) ? true : detection.found,
              explanation: r.explanation || "Identified from the X-ray image.",
              mode: "ai",
            };
          }
        }
      } catch {
        /* network/AI error — fall through to local heuristic */
      }

      if (cancelledRef.current) return;

      // 3. The AI explicitly said this is not an X-ray → reject, do not guess.
      if (aiSaysNotXray) {
        setIsProcessing(false);
        setError(
          "This image does not appear to be an X-ray. Please upload a genuine X-ray / radiograph image."
        );
        return;
      }

      // 4. If the AI gave a valid classification, use it — but reject low confidence.
      if (aiResult) {
        if (aiResult.confidence < 70) {
          setIsProcessing(false);
          setError("This image does not appear to be a clear X-ray. The AI confidence is too low. Please upload a valid X-ray image.");
          return;
        }
        setResult(aiResult);
        persistHistory(aiResult);
        setIsProcessing(false);
        return;
      }

      // 5. No AI available — use the local heuristic. First gate on whether the
      //    image even looks like an X-ray (near-monochrome). Reject colorful
      //    photos instead of fabricating a body part.
      const likeness = looksLikeXray(img);
      if (!likeness.isXray) {
        setIsProcessing(false);
        setError(
          "This image does not appear to be an X-ray (it looks like a regular color photo). Please upload a genuine X-ray image."
        );
        return;
      }

      const detection = detectBodyRegion(img);
      const local = classifyBodyPart(fileName, img, detection.box);
      const localResult: XRayResult = {
        bodyPart: local.bodyPart,
        confidence: local.confidence,
        box: detection.box,
        boxFound: detection.found,
        explanation: `${local.explanation} (Estimated on-device; connect an AI key for a verified result.)`,
        mode: "demo",
      };
      setResult(localResult);
      persistHistory(localResult);
      setIsProcessing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed. Please try another image.");
      setIsProcessing(false);
    }
  };

  const persistHistory = (r: XRayResult) => {
    const record: XRayAnalysis = {
      id: Date.now().toString(),
      bodyPart: r.bodyPart,
      confidence: r.confidence,
      box: r.box,
      createdAt: new Date().toISOString(),
    };
    storageService.saveXRayAnalysis(record);
    setHistory(storageService.getXRayAnalyses());
  };

  // Full reset to the initial upload state.
  const reset = () => {
    cancelledRef.current = true;
    setImageSrc(null);
    setFileName("");
    setResult(null);
    setError(null);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      <GlassCard>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Bone className="h-6 w-6 text-white" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-lg font-medium text-white">X-Ray Analyzer</h2>
            <p className="mt-1 text-sm text-white/60">
              Upload an X-ray image to detect the body region. Falls back to on-device demo mode
              when no AI key is configured.
            </p>
          </div>
        </div>
      </GlassCard>

      {error && (
        <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/15">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/80" strokeWidth={1.5} />
          <p className="text-sm text-white/80">{error}</p>
        </div>
      )}

      {!imageSrc && (
        <GlassCard>
          <div className="rounded-xl border-2 border-dashed border-white/15 p-8 text-center transition hover:border-white/30">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-white/10">
              <ScanLine className="h-8 w-8 text-white/70" strokeWidth={1.25} />
            </div>
            <p className="mb-2 font-medium text-white">Upload X-Ray Image</p>
            <p className="mb-6 text-sm text-white/50">PNG, JPG, JPEG, or WEBP · up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
            <GlassButton onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Choose X-Ray
            </GlassButton>
          </div>
        </GlassCard>
      )}

      {imageSrc && (
        <GlassCard>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-white">
                {result ? "Analysis Result" : "Preview"}
              </h3>
              {result && (
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/80">
                  {result.mode === "ai" ? "AI Mode" : "AI Demo Mode"}
                </span>
              )}
            </div>
            {/* Reset button in result/preview header */}
            <button
              onClick={reset}
              aria-label="Cancel scan"
              className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-sm text-white/80 outline-none transition hover:scale-105 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <X className="h-4 w-4" /> Cancel Scan
            </button>
          </div>

          <div className="mb-4 flex justify-center overflow-hidden rounded-xl bg-white/5 p-2">
            {result ? (
              <canvas ref={canvasRef} className="max-h-[440px] w-auto rounded-lg" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt="X-ray preview"
                className="max-h-[440px] w-auto rounded-lg object-contain"
              />
            )}
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Detected Body Part</p>
                  <p className="text-2xl font-medium text-white">{result.bodyPart}</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Confidence</p>
                  <p className="text-2xl font-medium text-white">{result.confidence}%</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-white/70 transition-all duration-700"
                      style={{ width: `${result.confidence}%` }}
                    />
                  </div>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-xs text-white/50">Bounding Box</p>
                  <p className="text-base font-medium text-white">
                    {result.boxFound ? "Region detected" : "Estimated (centered)"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-white/5 p-4">
                <p className="text-xs text-white/50">Explanation</p>
                <p className="text-sm text-white/80">{result.explanation}</p>
              </div>

              <GlassButton onClick={reset} variant="ghost" className="w-full justify-center">
                <X className="h-4 w-4" /> Reset Scan
              </GlassButton>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              <GlassButton onClick={analyze} disabled={isProcessing} className="flex-1 justify-center">
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4" /> Analyze X-Ray
                  </>
                )}
              </GlassButton>
              <button
                onClick={reset}
                aria-label="Cancel scan"
                className="flex items-center justify-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 outline-none transition hover:scale-105 hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
              >
                <X className="h-4 w-4" /> {isProcessing ? "Cancel" : "Cancel Scan"}
              </button>
            </div>
          )}
        </GlassCard>
      )}

      {history.length > 0 && (
        <GlassCard>
          <SectionTitle icon={<Camera className="h-5 w-5 text-white" strokeWidth={1.5} />}>
            Recent Analyses
          </SectionTitle>
          <div className="mt-4 space-y-2">
            {history.slice(0, 5).map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                <div>
                  <p className="text-sm font-medium text-white">{h.bodyPart}</p>
                  <p className="text-xs text-white/50">{new Date(h.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-sm font-medium text-white/70">{h.confidence}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      <div className="flex items-start gap-3 rounded-xl bg-white/5 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-white/70" strokeWidth={1.5} />
        <p className="text-xs text-white/60">
          This feature identifies the X-ray body part only. It does not diagnose disease, fracture,
          infection, or medical condition. Always consult a certified radiologist or doctor.
        </p>
      </div>
    </div>
  );
}
