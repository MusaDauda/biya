import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap, Delete } from "lucide-react";
import { biya, font } from "../theme";
import { type Vendor } from "../data";
import { CameraDeniedFallback } from "./CameraDeniedFallback";
import { supabase } from "../../../../lib/supabase";
import { normalizeVendorCode } from "../demoData";
import { vendorIcons } from "../data";
import jsQR from "jsqr/dist/jsQR.js";

export function ScanToPay({ vendors, startManual = false, onClose, onContinue }: { vendors: Vendor[]; startManual?: boolean; onClose: () => void; onContinue: (vendor: Vendor, amount: number) => void }) {
  const [torch, setTorch] = useState(false);
  const [detected, setDetected] = useState<Vendor | null>(null);
  const [amount, setAmount] = useState("");
  const [cameraDenied, setCameraDenied] = useState(startManual);
  const [manualRequested, setManualRequested] = useState(startManual);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (startManual) {
      setCameraDenied(true);
      setManualRequested(true);
    }
  }, [startManual]);

  useEffect(() => {
    const track = streamRef.current?.getVideoTracks()?.[0];
    if (!track) return;
    const caps = (track as any).getCapabilities?.();
    if (caps && caps.torch) {
      try {
        // @ts-ignore
        track.applyConstraints({ advanced: [{ torch }] });
      } catch (e) {
        // ignore if not supported
      }
    }
  }, [torch]);

  // Real camera + QR detection using BarcodeDetector (if available).
  useEffect(() => {
    let detector: any = null;
    let raf = 0;

    async function findVendorByCode(code: string) {
      const normalized = normalizeVendorCode(code, false) || code.replace(/\D/g, "");
      const digits = (normalized || "").toString().replace(/\D/g, "");
      if (digits.length !== 10) return null;
      const match = vendors.find((v) => v.code === digits);
      if (match) return match;

      // fallback: query supabase directly for vendor with this code
      try {
        const { data, error } = await supabase.from("users").select("*").eq("type", "vendor").filter("details->>code", "eq", digits).maybeSingle();
        if (!error && data) {
          return {
            id: data.id,
            name: data.name,
            code: digits,
            campus: data.details?.campus || "",
            icon: vendorIcons[data.name] ?? vendorIcons["Samaru Mart"],
          } as Vendor;
        }
      } catch (e) {
        // ignore
      }
      return null;
    }

    async function startCamera() {
      if (cameraDenied || detected) return;
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraDenied(true);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        streamRef.current = stream;
        scanningRef.current = true;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

            // Try using BarcodeDetector if available
            if ((window as any).BarcodeDetector) {
              const BD = (window as any).BarcodeDetector;
              detector = new BD({ formats: ["qr_code"] });

              const scanLoop = async () => {
                if (!videoRef.current || !scanningRef.current) return;
                try {
                  const results = await detector.detect(videoRef.current);
                  if (results && results.length > 0) {
                    const raw = results[0].rawValue || "";
                    const v = await findVendorByCode(raw);
                    if (v) {
                      setDetected(v);
                      stopCamera();
                      return;
                    }
                  }
                } catch (e) {
                  // ignore detection errors
                }
                raf = requestAnimationFrame(scanLoop);
              };
              raf = requestAnimationFrame(scanLoop);
            } else {
              // If no BarcodeDetector, use jsQR fallback (canvas frame scanning)
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              const scanLoop = async () => {
                if (!videoRef.current || !scanningRef.current || !ctx) return;
                try {
                  const w = videoRef.current.videoWidth;
                  const h = videoRef.current.videoHeight;
                  if (w === 0 || h === 0) {
                    raf = requestAnimationFrame(scanLoop);
                    return;
                  }
                  canvas.width = w;
                  canvas.height = h;
                  ctx.drawImage(videoRef.current, 0, 0, w, h);
                  const imageData = ctx.getImageData(0, 0, w, h);
                  const code = jsQR(imageData.data, w, h);
                  if (code && code.data) {
                    const raw = code.data || "";
                    const v = await findVendorByCode(raw);
                    if (v) {
                      setDetected(v);
                      stopCamera();
                      return;
                    }
                  }
                } catch (e) {
                  // ignore
                }
                raf = requestAnimationFrame(scanLoop);
              };
              raf = requestAnimationFrame(scanLoop);
            }
      } catch (e) {
        setCameraDenied(true);
      }
    }

    function stopCamera() {
      scanningRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (raf) cancelAnimationFrame(raf);
    }

    startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cameraDenied, detected, vendors]);

  const press = (key: string) => {
    setAmount((prev) => {
      if (key === "del") return prev.slice(0, -1);
      if (key === ".") return prev.includes(".") ? prev : prev === "" ? "0." : prev + ".";
      if (prev.replace(".", "").length >= 7) return prev;
      return prev + key;
    });
  };

  const numeric = parseFloat(amount || "0");
  const display = amount === "" ? "0.00" : amount;

  // Camera denied fallback — user can enter a Biya account number manually
  const handleClose = () => {
    setManualRequested(false);
    onClose();
  };

  if (cameraDenied) {
    return (
      <CameraDeniedFallback
        vendors={vendors}
        startManual={manualRequested}
        onClose={handleClose}
        onVendorFound={(vendor) => {
          setDetected(vendor);
          setCameraDenied(false);
          setManualRequested(false);
        }}
      />
    );
  }

  return (
    <div className="h-full relative overflow-hidden" style={{ backgroundColor: "#000" }}>
      {/* Camera video (real) */}
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover z-0" style={{ display: cameraDenied ? "none" : "block", opacity: torch ? 0.95 : 0.8 }} muted playsInline />
      {/* Simulated camera view (fallback visuals) */}
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 40%, #2a2f3d 0%, #0a0c12 100%)", opacity: cameraDenied ? 1 : 0.0 }} />

      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-20">
        <button onClick={onClose} className="flex items-center justify-center rounded-full backdrop-blur" style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.12)" }}>
          <X size={20} color="#fff" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setCameraDenied(true);
              setManualRequested(true);
            }}
            className="flex items-center justify-center rounded-full backdrop-blur"
            style={{ width: 48, height: 48, backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <span style={{ fontFamily: font.mono, fontSize: 9, color: "#fff", letterSpacing: "0.5px" }}>CODE</span>
          </button>
          <button onClick={() => setTorch((t) => !t)} className="flex items-center justify-center rounded-full backdrop-blur" style={{ width: 48, height: 48, backgroundColor: torch ? biya.marigold : "rgba(255,255,255,0.12)" }}>
            <Zap size={20} color={torch ? biya.ink : "#fff"} fill={torch ? biya.ink : "none"} />
          </button>
        </div>
      </div>

      {/* Reticle + instruction */}
      {!detected && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          <p className="px-10 text-center mb-10" style={{ fontFamily: font.display, fontSize: 16, color: "#fff", textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
            Point your camera at the vendor's Biya account number
          </p>
          <div className="relative" style={{ width: 256, height: 256 }}>
            {[["top-0 left-0", "border-t-4 border-l-4 rounded-tl-xl"], ["top-0 right-0", "border-t-4 border-r-4 rounded-tr-xl"], ["bottom-0 left-0", "border-b-4 border-l-4 rounded-bl-xl"], ["bottom-0 right-0", "border-b-4 border-r-4 rounded-br-xl"]].map(([pos, b], i) => (
              <div key={i} className={`absolute ${pos} ${b}`} style={{ width: 40, height: 40, borderColor: biya.marigold }} />
            ))}
            <motion.div
              className="absolute left-0 right-0"
              style={{ height: 2, backgroundColor: biya.marigold, boxShadow: `0 0 15px ${biya.marigold}` }}
              animate={{ top: [0, 254, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <button
            onClick={() => {
              setCameraDenied(true);
              setManualRequested(true);
            }}
            className="mt-8 rounded-full px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
            style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
          >
            Enter account number manually
          </button>
        </div>
      )}

      {/* Bottom sheet on detection */}
      <AnimatePresence>
        {detected && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute bottom-0 left-0 right-0 z-30 flex flex-col"
            style={{ backgroundColor: biya.cream, borderTopLeftRadius: 36, borderTopRightRadius: 36, maxHeight: "88%" }}
          >
            <div className="flex flex-col items-center pt-4 pb-2">
              <span className="rounded-full" style={{ width: 44, height: 5, backgroundColor: biya.muteDeep }} />
            </div>

            <div className="px-6 pt-2 pb-4 text-center">
              <p style={{ fontFamily: font.display, fontWeight: 700, fontSize: 20, color: biya.ink }}>{detected.name}</p>
              <p style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1.4px", color: biya.gray }}>{detected.campus}</p>
            </div>

            <div className="px-6">
              <div className="rounded-[28px] flex flex-col items-center justify-center py-6" style={{ backgroundColor: biya.muteAlt, border: `1px solid ${biya.line}` }}>
                <span style={{ fontFamily: font.mono, fontSize: 11, letterSpacing: "1.2px", color: biya.gray }}>AMOUNT TO PAY</span>
                <div className="flex items-baseline gap-1 mt-2">
                  <span style={{ fontFamily: font.serif, fontSize: 28, color: numeric > 0 ? biya.ink : biya.gray }}>₦</span>
                  <span style={{ fontFamily: font.mono, fontWeight: 700, fontSize: 40, color: numeric > 0 ? biya.ink : biya.gray, letterSpacing: "-0.03em" }}>{display}</span>
                </div>
              </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-2 px-4 pt-4">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "del"].map((k) => (
                <button
                  key={k}
                  onClick={() => press(k)}
                  className="flex items-center justify-center rounded-2xl transition-colors active:bg-[#e4e2df]"
                  style={{ height: 58, backgroundColor: "#fff", border: `1px solid ${biya.line}` }}
                >
                  {k === "del" ? <Delete size={20} color={biya.ink} /> : <span style={{ fontFamily: font.mono, fontSize: 22, color: biya.ink }}>{k}</span>}
                </button>
              ))}
            </div>

            <div className="px-6 pt-4 pb-8">
              <button
                onClick={() => numeric > 0 && onContinue(detected, numeric)}
                disabled={numeric <= 0}
                className="w-full flex items-center justify-center rounded-full transition-transform active:scale-[0.98] disabled:opacity-50"
                style={{ height: 56, backgroundColor: biya.marigold, fontFamily: font.display, fontWeight: 700, fontSize: 18, color: biya.goldDeep }}
              >
                Biya ₦{numeric > 0 ? numeric.toLocaleString("en-NG") : "0"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
