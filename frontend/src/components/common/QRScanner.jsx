import React, { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import axios from "axios";
import { toast } from "sonner";
import { Camera, QrCode, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const SCAN_COOLDOWN_MS = 450;

export default function QRScanner({ profile, onAttendanceCaptured }) {
  const regionIdRef = useRef(`qr-reader-region-${Math.random().toString(36).slice(2)}`);
  const regionId = regionIdRef.current;

  const qrRef = useRef(null);
  const lastScanAtRef = useRef(0);
  const mountedRef = useRef(false);
  const startLockRef = useRef(false);
  const sessionRef = useRef(0);

  const jwt = localStorage.getItem("token");

  const [status, setStatus] = useState({
    type: "idle",
    title: "Ready to scan",
    message: "Point your camera at the organizer event QR.",
  });
  const [scannedPayload, setScannedPayload] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);

  const studentInfo = useMemo(
    () => ({
      name: profile?.name || localStorage.getItem("studentName") || "Student",
      email: profile?.email || localStorage.getItem("studentEmail") || "—",
      rollNo: profile?.rollNo || profile?.roll_no || "—",
      department: profile?.department || "—",
      phone: profile?.phone || "—",
      gender: profile?.gender || "—",
      year: profile?.year || "—",
    }),
    [profile]
  );

  const setErr = (title, message) => setStatus({ type: "error", title, message });
  const setOk = (title, message) => setStatus({ type: "success", title, message });

  const parseQr = (decodedText) => {
    try {
      const obj = JSON.parse(decodedText);
      if (!obj?.eventId || !obj?.token) return null;
      return obj;
    } catch {
      return null;
    }
  };

  const hardClearRegion = () => {
    const el = document.getElementById(regionId);
    if (el) el.innerHTML = "";
  };

  const stopScanner = async (reason = "stopped") => {
    if (isStopping) return;

    setIsStopping(true);

    try {
      sessionRef.current += 1;

      if (qrRef.current) {
        try {
          await qrRef.current.stop();
        } catch {}

        try {
          await qrRef.current.clear();
        } catch {}

        qrRef.current = null;
      }

      hardClearRegion();
    } finally {
      setScannerActive(false);
      setIsStopping(false);
      setStatus((s) => ({
        ...s,
        type: "stopped",
        title: reason === "success" ? "Attendance captured" : "Scanner closed",
        message:
          reason === "success"
            ? "Your attendance and student details were saved."
            : "Tap Start to scan again.",
      }));
    }
  };

  const startScanner = async () => {
    if (!mountedRef.current || startLockRef.current) return;
    startLockRef.current = true;

    if (isStarting || scannerActive) {
      startLockRef.current = false;
      return;
    }

    if (!jwt) {
      toast.error("Please login to scan event QR.", { duration: 3500 });
      setErr("Not logged in", "Login is required before scanning attendance QR codes.");
      startLockRef.current = false;
      return;
    }

    setIsStarting(true);
    setScannedPayload(null);
    setStatus({ type: "scanning", title: "Scanning...", message: "Align the event QR inside the frame." });

    const mySession = sessionRef.current + 1;
    sessionRef.current = mySession;

    try {
      hardClearRegion();

      if (qrRef.current) {
        await stopScanner("stopped");
      }

      if (!mountedRef.current || sessionRef.current !== mySession) return;

      const html5Qr = new Html5Qrcode(regionId);
      qrRef.current = html5Qr;

      await html5Qr.start(
        { facingMode: "environment" },
        {
          fps: 24,
          qrbox: { width: 240, height: 240 },
          aspectRatio: 1.333334,
          disableFlip: false,
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        },
        async (decodedText) => {
          if (!mountedRef.current || sessionRef.current !== mySession) return;

          const now = Date.now();
          if (now - lastScanAtRef.current < SCAN_COOLDOWN_MS) return;
          lastScanAtRef.current = now;

          const payload = parseQr(decodedText);
          if (!payload) {
            toast.warning("Invalid QR format", { duration: 2500 });
            setErr("Invalid QR", "This QR is not a valid organizer attendance QR.");
            return;
          }

          setScannedPayload(payload);

          try {
            const res = await axios.post(
              `${BACKEND}/api/students/events/${payload.eventId}/qr/scan`,
              {
                token: payload.token,
                day: payload.day,
                qr_type: payload.qr_type,
                studentDetails: studentInfo,
              },
              { headers: { Authorization: `Bearer ${jwt}` } }
            );

            const msg = res.data?.message || "Your attendance is marked 😊";
            const attendanceNote =
              res.data?.attendance?.note || "Your attendance has been saved successfully.";
            const certificateNo = res.data?.certificate?.certificate_no || null;
            const successDescription = certificateNo
              ? `${attendanceNote} Certificate is now available to download.`
              : attendanceNote;

            toast.success(msg, {
              description: successDescription,
              duration: 3200,
            });
            setOk(msg, successDescription);

            if (typeof onAttendanceCaptured === "function") {
              await onAttendanceCaptured(res.data);
            }

            setTimeout(() => {
              if (mountedRef.current) stopScanner("success");
            }, 700);
          } catch (err) {
            const apiErr =
              err?.response?.data?.error ||
              err?.message ||
              "Scan failed. Please try again.";

            lastScanAtRef.current = 0;

            if (String(err?.response?.status) === "401") {
              toast.error("Session expired. Please login again.", { duration: 3500 });
              setErr("Unauthorized", "Your session expired. Please login again.");
              setTimeout(() => {
                if (mountedRef.current) stopScanner("error");
              }, 800);
              return;
            }

            if (String(err?.response?.status) === "400") {
              toast.warning(apiErr, { duration: 3500 });
              setErr("Cannot accept scan", apiErr);
              return;
            }

            toast.error(apiErr, { duration: 3500 });
            setErr("Scan failed", apiErr);
          }
        },
        () => {}
      );

      if (!mountedRef.current || sessionRef.current !== mySession) return;
      setScannerActive(true);
    } catch (e) {
      setScannerActive(false);
      qrRef.current = null;
      hardClearRegion();

      const msg = String(e?.message || e);
      if (msg.toLowerCase().includes("permission")) {
        setErr("Camera permission denied", "Please allow camera access in browser settings.");
      } else if (msg.toLowerCase().includes("not found")) {
        setErr("No camera found", "No camera device detected on this device.");
      } else {
        setErr("Unable to start scanner", "Please refresh and try again.");
      }

      toast.error("Unable to start QR scanner", { duration: 3500 });
    } finally {
      setIsStarting(false);
      startLockRef.current = false;
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(() => startScanner(), 0);

    return () => {
      clearTimeout(t);
      mountedRef.current = false;
      stopScanner("stopped");
    };
  }, []);

  const StatusIcon = () => {
    if (status.type === "success") return <CheckCircle2 className="w-5 h-5 text-green-400" />;
    if (status.type === "error") return <XCircle className="w-5 h-5 text-red-400" />;
    if (status.type === "scanning") return <QrCode className="w-5 h-5 text-blue-400" />;
    return <Camera className="w-5 h-5 text-gray-300" />;
  };

  return (
    <div className="w-full">
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              Event QR Scanner
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Scan the organizer event QR to mark your attendance and attach your student details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {scannerActive && (
              <button
                onClick={() => stopScanner("stopped")}
                disabled={isStopping}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-sm font-semibold"
              >
                {isStopping ? "Closing..." : "Close"}
              </button>
            )}

            {!scannerActive && (
              <button
                onClick={startScanner}
                disabled={isStarting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                {isStarting ? "Starting..." : "Start"}
              </button>
            )}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="relative">
            <div className="relative rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-4 top-4 w-8 h-8 border-l-4 border-t-4 border-blue-500/80 rounded-tl-2xl" />
                <div className="absolute right-4 top-4 w-8 h-8 border-r-4 border-t-4 border-blue-500/80 rounded-tr-2xl" />
                <div className="absolute left-4 bottom-4 w-8 h-8 border-l-4 border-b-4 border-blue-500/80 rounded-bl-2xl" />
                <div className="absolute right-4 bottom-4 w-8 h-8 border-r-4 border-b-4 border-blue-500/80 rounded-br-2xl" />
                {status.type === "scanning" && (
                  <div className="absolute left-0 right-0 top-10 h-[2px] bg-blue-500/70 animate-pulse" />
                )}
              </div>

              <div id={regionId} className="w-full min-h-[320px]" />
            </div>

            <div
              className={`mt-4 rounded-2xl border p-4 flex items-start gap-3 ${
                status.type === "success"
                  ? "border-green-500/20 bg-green-500/10"
                  : status.type === "error"
                  ? "border-red-500/20 bg-red-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="mt-0.5">
                <StatusIcon />
              </div>
              <div>
                <p className="font-semibold">{status.title}</p>
                <p className="text-sm text-gray-300 mt-1">{status.message}</p>
              </div>
            </div>

            {scannedPayload && (
              <div className="mt-4 text-xs text-gray-400 bg-white/5 border border-white/10 rounded-2xl p-4 overflow-auto">
                <p className="font-semibold text-gray-200 mb-2">Scanned QR payload</p>
                <pre className="whitespace-pre-wrap break-words">
                  {JSON.stringify(scannedPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-5 h-5 text-gray-300" />
              <h3 className="font-semibold text-lg">Student Details</h3>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="Name" value={studentInfo.name} />
              <Row label="Email" value={studentInfo.email} />
              <Row label="Roll No" value={studentInfo.rollNo} />
              <Row label="Department" value={studentInfo.department} />
              <Row label="Phone" value={studentInfo.phone} />
              <Row label="Gender" value={studentInfo.gender} />
              <Row label="Year" value={studentInfo.year} />
            </div>

            <div className="mt-5 text-xs text-gray-400 leading-relaxed">
              <p>Your current dashboard details are attached to the scan and saved to the backend.</p>
              <p className="mt-2">Tip: Use good lighting and hold the phone steady for 1-2 seconds.</p>
            </div>

            {status.type === "stopped" && (
              <div className="mt-5">
                <button
                  onClick={startScanner}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl"
                >
                  Scan another QR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-100 font-semibold truncate max-w-[60%]" title={value}>
        {value}
      </span>
    </div>
  );
}
