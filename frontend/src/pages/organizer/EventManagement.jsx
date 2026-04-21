import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import {
  fetchEventParticipants,
  issueCertificate,
  openAttendance,
  openEventQr,
  downloadEventAttendancePdf,
} from "../../services/apiOrganizer";

function getAttendanceBadgeClass(participant) {
  if (participant.attendance_status !== "Present") {
    return "border-slate-300 bg-slate-50 text-slate-700";
  }

  if (participant.attendance_color === "red") {
    return "border-red-300 bg-red-50 text-red-700";
  }

  return "border-green-300 bg-green-50 text-green-700";
}

function getScanBadgeClass(scanned) {
  return scanned
    ? "border-green-300 bg-green-50 text-green-700"
    : "border-red-300 bg-red-50 text-red-700";
}

function getEventStatusBadge(status) {
  if (String(status).toLowerCase() === "live") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-[0_14px_28px_rgba(34,197,94,0.16)]";
  }

  return "border-white/80 bg-white/90 text-slate-800 shadow-[0_12px_28px_rgba(148,163,184,0.1)]";
}

export default function EventManagement() {
  const { eventId } = useParams();
  const navigate = useNavigate();

  const [eventStatus, setEventStatus] = useState("-");
  const [eventMeta, setEventMeta] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingAttendancePdf, setDownloadingAttendancePdf] = useState(false);
  const [qrSessions, setQrSessions] = useState({});
  const [visibleQrTypes, setVisibleQrTypes] = useState({
    ENTRY: false,
    EXIT: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchEventParticipants(eventId);
      setEventStatus(res?.eventStatus || "-");
      setParticipants(Array.isArray(res?.participants) ? res.participants : []);
      setEventMeta(res?.event || null);
    } catch {
      alert("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  useEffect(() => {
    setVisibleQrTypes({
      ENTRY: !!qrSessions.ENTRY,
      EXIT: !!qrSessions.EXIT,
    });
  }, [qrSessions]);

  const canOpenQr = useMemo(() => {
    if (!eventMeta) return false;
    return eventMeta.status !== "Archived";
  }, [eventMeta]);

  const openAtt = async () => {
    const res = await openAttendance(eventId);
    toast.success("Attendance opened", {
      description: `Code: ${res.code}`,
    });
  };

  const openQr = async (qrType) => {
    const sessionKey = qrType;
    const existingQr = qrSessions[sessionKey];

    if (existingQr) {
      setVisibleQrTypes((prev) => ({ ...prev, [qrType]: true }));
      toast.success(`${qrType} QR reopened`, {
        description: "Showing the same QR that was already opened for this event.",
      });
      return;
    }

    const res = await openEventQr(eventId, qrType);
    setQrSessions((prev) => ({
      ...prev,
      [sessionKey]: {
        token: res.token,
        expiresAt: res.expiresAt,
        qr_type: qrType,
      },
    }));
    setVisibleQrTypes((prev) => ({ ...prev, [qrType]: true }));

    toast.success(
      res?.reused ? `${qrType} QR reused` : `${qrType} QR generated`,
      {
        description: "Students can scan this QR from the dashboard scanner.",
      }
    );
  };

  const issue = async (studentId) => {
    await issueCertificate(eventId, studentId);
    toast.success("Certificate issued");
    load();
  };

  const downloadAttendance = async () => {
    if (downloadingAttendancePdf) return;

    setDownloadingAttendancePdf(true);
    const tId = toast.loading("Preparing attendance PDF...", { duration: Infinity });

    try {
      const blob = await downloadEventAttendancePdf(eventId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `event-${eventId}-attendance.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss(tId);
      toast.success("Attendance PDF downloaded");
    } catch {
      toast.dismiss(tId);
      toast.error("Failed to download attendance PDF");
    } finally {
      setDownloadingAttendancePdf(false);
    }
  };

  const dayStats = useMemo(() => {
    const total = participants.length;
    const present = participants.filter((p) => p.attendance_status === "Present").length;
    const absent = total - present;
    return { total, present, absent };
  }, [participants]);

  return (
    <div className="ucef-page-shell">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="ucef-back-btn mb-3"
            >
              <span aria-hidden="true">←</span>
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold">Event Management</h1>
          </div>

          <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${getEventStatusBadge(eventStatus)}`}>
            <span>Status:</span>
            {String(eventStatus).toLowerCase() === "live" && (
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </span>
            )}
            <b>{eventStatus}</b>
          </span>
        </div>

        <div className="ucef-card p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">Attendance</h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
              <p className="text-xs font-medium text-slate-700">Registered</p>
              <p className="text-2xl font-bold text-slate-900">{dayStats.total}</p>
            </div>
            <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
              <p className="text-xs font-medium text-slate-700">Present</p>
              <p className="text-2xl font-bold text-cyan-700">{dayStats.present}</p>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
              <p className="text-xs font-medium text-slate-700">Absent</p>
              <p className="text-2xl font-bold text-slate-700">{dayStats.absent}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={openAtt}
              className="ucef-primary-btn !rounded-xl !px-4 !py-2 text-sm"
            >
              Open Attendance
            </button>

            <button
              onClick={() => openQr("ENTRY")}
              disabled={!canOpenQr}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                canOpenQr
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "border border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
              }`}
              title={!canOpenQr ? "Archived events cannot generate attendance QR" : ""}
            >
              Open Entry QR
            </button>

            <button
              onClick={() => openQr("EXIT")}
              disabled={!canOpenQr}
              className={`px-4 py-2 rounded-xl text-sm font-semibold ${
                canOpenQr
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "border border-slate-300 bg-slate-100 text-slate-500 cursor-not-allowed"
              }`}
              title={!canOpenQr ? "Archived events cannot generate attendance QR" : ""}
            >
              Open Exit QR
            </button>
          </div>

          {(visibleQrTypes.ENTRY || visibleQrTypes.EXIT) && (
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {["ENTRY", "EXIT"].map((qrType) => {
                if (!visibleQrTypes[qrType]) return null;

                const sessionKey = qrType;
                const qr = qrSessions[sessionKey];
                if (!qr) return null;

                return (
                  <div
                    key={qrType}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {qrType} Attendance QR
                        </h3>
                      </div>

                      <button
                        onClick={() =>
                          setVisibleQrTypes((prev) => ({
                            ...prev,
                            [qrType]: false,
                          }))
                        }
                        className="text-sm text-slate-500 hover:text-slate-900"
                      >
                        Close
                      </button>
                    </div>

                    <div className="mt-4 flex justify-center">
                      <QRCodeCanvas
                        value={JSON.stringify({
                          eventId,
                          token: qr.token,
                          qr_type: qr.qr_type,
                        })}
                        size={220}
                      />
                    </div>

                    <p className="text-xs mt-4 break-all text-slate-700">
                      Token: <b>{qr.token}</b>
                    </p>

                    {qr.expiresAt && (
                      <p className="text-xs text-slate-500 mt-1">
                        Expires: {new Date(qr.expiresAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="ucef-table">
          <div className="flex items-center justify-between gap-4 p-5 border-b border-white/10">
            <h2 className="text-xl font-semibold">Participants</h2>
            <button
              onClick={downloadAttendance}
              disabled={downloadingAttendancePdf}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                downloadingAttendancePdf
                  ? "cursor-not-allowed border border-slate-200 bg-slate-100 text-slate-500"
                  : "border border-blue-200 bg-blue-50 text-blue-700 hover:-translate-y-1 hover:bg-blue-100"
              }`}
            >
              {downloadingAttendancePdf ? "Preparing PDF..." : "Download Attendance PDF"}
            </button>
          </div>

          {loading ? (
            <p className="p-6 text-slate-700">Loading participants...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-blue-50/70 text-slate-600">
                  <tr>
                    <th className="p-4 text-left">Name</th>
                    <th className="p-4 text-left">Roll No</th>
                    <th className="p-4 text-left">Email</th>
                    <th className="p-4 text-left">Last Scan</th>
                    <th className="p-4">Entry QR</th>
                    <th className="p-4">Exit QR</th>
                    <th className="p-4">Certificate</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {participants.map((p) => {
                    const eligible =
                      p.attendance_status === "Present" &&
                      ["Completed", "Archived"].includes(eventStatus) &&
                      !p.certified;

                    return (
                      <tr
                        key={p.student_id}
                        className="border-t border-white/10 hover:bg-white/5"
                      >
                        <td className="p-4 font-medium">{p.name}</td>
                        <td className="p-4 text-slate-700">{p.roll_no || "-"}</td>
                        <td className="p-4 text-slate-700">{p.email}</td>
                        <td className="p-4 text-slate-700">
                          {p.last_scanned_at
                            ? new Date(p.last_scanned_at).toLocaleString()
                            : "-"}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs border ${getScanBadgeClass(
                              p.has_entry_scan
                            )}`}
                          >
                            {p.has_entry_scan ? "Scanned" : "Not Scanned"}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs border ${getScanBadgeClass(
                              p.has_exit_scan
                            )}`}
                          >
                            {p.has_exit_scan ? "Scanned" : "Not Scanned"}
                          </span>
                        </td>

                        <td className="p-4 text-center">
                          {p.certified ? (
                            <span className="rounded-full border border-green-300 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              Yes
                            </span>
                          ) : eligible ? (
                            <button
                              onClick={() => issue(p.student_id)}
                              className="rounded-lg bg-blue-700 px-3 py-1 text-xs font-semibold text-white"
                            >
                              Issue Cert
                            </button>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs border ${getAttendanceBadgeClass(
                              p
                            )}`}
                          >
                            {p.attendance_status}
                          </span>
                          {p.attendance_note && (
                            <p className="mt-2 text-xs text-slate-500">{p.attendance_note}</p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {participants.length === 0 && (
                <p className="p-6 text-slate-700">No registrations yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
