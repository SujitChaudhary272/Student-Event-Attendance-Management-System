import React, { useState } from "react";
import { toast } from "sonner";
import { Download, BadgeCheck } from "lucide-react";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CertificateCard({ participation, onCertificateGenerated }) {
  const [downloading, setDownloading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const certificateId = participation?.certificateId;
  const canGenerate = participation?.canGenerateCertificate === true;

  const generateCertificate = async () => {
    if (!participation?.eventId || !canGenerate || generating) return;

    setGenerating(true);
    const tId = toast.loading("Generating certificate...", { duration: Infinity });

    try {
      const res = await fetch(
        `${BACKEND}/api/students/events/${participation.eventId}/certificates/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const data = await res.json().catch(() => ({}));

      toast.dismiss(tId);

      if (!res.ok) {
        toast.error(data.error || "Failed to generate certificate", { duration: 3500 });
        return;
      }

      toast.success(data.message || "Certificate generated successfully", {
        duration: 2500,
      });

      if (typeof onCertificateGenerated === "function") {
        await onCertificateGenerated();
      }
    } catch {
      toast.dismiss(tId);
      toast.error("Network error. Please try again.", { duration: 3500 });
    } finally {
      setGenerating(false);
    }
  };

  const downloadCertificate = async () => {
    if (!certificateId) {
      toast.error("Certificate not available yet.", { duration: 3000 });
      return;
    }

    setDownloading(true);
    const tId = toast.loading("Preparing certificate...", { duration: Infinity });

    try {
      const res = await fetch(
        `${BACKEND}/api/students/certificates/${certificateId}/download`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.dismiss(tId);
        toast.error(data.error || "Download failed", { duration: 3500 });
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.dismiss(tId);
      toast.success("Certificate downloaded.", { duration: 2500 });
    } catch {
      toast.dismiss(tId);
      toast.error("Network error. Please try again.", { duration: 3500 });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="ucef-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-lg font-semibold text-slate-900">
            {participation?.eventName || "Event"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {participation?.club || "Club"} - {participation?.year || "-"}
          </p>
        </div>

        <div
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
            certificateId
              ? "border border-cyan-300 bg-cyan-50 text-cyan-800"
              : canGenerate
              ? "border border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <BadgeCheck className="h-4 w-4" />
          {certificateId ? "Certified" : canGenerate ? "Ready" : "Pending"}
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-700">
        <p>
          Certificate ID:{" "}
          <span className="break-all font-mono text-xs text-slate-600">
            {certificateId || "-"}
          </span>
        </p>
      </div>

      {certificateId ? (
        <button
          onClick={downloadCertificate}
          disabled={downloading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#2563eb,#38bdf8)] py-2.5 font-semibold text-white shadow-[0_14px_28px_rgba(37,99,235,0.2)] transition hover:-translate-y-1"
        >
          <Download className="h-4 w-4" />
          {downloading ? "Downloading..." : "Download Certificate"}
        </button>
      ) : canGenerate ? (
        <button
          onClick={generateCertificate}
          disabled={generating}
          className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 font-semibold transition ${
            generating
              ? "cursor-not-allowed bg-emerald-300 text-white"
              : "bg-emerald-600 text-white shadow-[0_14px_28px_rgba(5,150,105,0.2)] hover:-translate-y-1 hover:bg-emerald-700"
          }`}
        >
          <BadgeCheck className="h-4 w-4" />
          {generating ? "Generating..." : "Generate Certificate"}
        </button>
      ) : (
        <button
          disabled
          className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-100 py-2.5 font-semibold text-slate-500"
        >
          <Download className="h-4 w-4" />
          Download Certificate
        </button>
      )}

      {!certificateId && (
        <p className="mt-3 text-xs text-slate-500">
          {canGenerate
            ? "Attendance is complete. If the certificate has not appeared automatically yet, you can generate it here."
            : "Certificate will become available after attendance is completed for this event."}
        </p>
      )}
    </div>
  );
}
