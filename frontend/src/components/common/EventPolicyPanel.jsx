import React from "react";

export default function EventPolicyPanel({ event }) {
  const attendanceMethod = event?.attendance_policy || event?.attendance_method || "QR_INOUT";
  const isQrInOut =
    attendanceMethod === "ENTRY_EXIT" ||
    attendanceMethod === "QR_INOUT";

  return (
    <div className="ucef-table">
      <div className="border-b border-white/70 p-5">
        <h2 className="text-xl font-semibold text-slate-900">Certificate Generation</h2>
        <p className="mt-2 text-sm text-slate-500">
          Certificates now use a built-in professional format with the PCCOE logo,
          college name, event details, verification QR, and the participating club logo.
        </p>
      </div>

      <div className="space-y-4 p-5 text-sm text-slate-700">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Template editor removed</p>
          <p className="mt-1 text-amber-800">
            Manual HTML template editing is no longer required for certificate generation.
          </p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
          <p className="font-semibold text-slate-900">Automatic issuance</p>
          <p className="mt-1">
            {isQrInOut
              ? "A certificate is issued automatically after the student completes both entry and exit QR scans for the event."
              : "A certificate is issued automatically once the student satisfies the attendance requirement for the event."}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
          <p className="font-semibold text-slate-900">Included on the certificate</p>
          <p className="mt-1">
            PCCOE branding, college name, club logo, student details, event date,
            duration, certificate number, and verification QR are added automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
