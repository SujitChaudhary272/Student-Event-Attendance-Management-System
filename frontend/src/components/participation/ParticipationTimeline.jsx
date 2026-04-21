import React, { useMemo } from "react";

const stateStyles = {
  Registered: "border-slate-300 bg-slate-50 text-slate-700",
  Attended: "border-blue-300 bg-blue-50 text-blue-800",
  Qualified: "border-amber-300 bg-amber-50 text-amber-800",
  Certified: "border-cyan-300 bg-cyan-50 text-cyan-800",
};

export default function ParticipationTimeline({ participations }) {
  const rows = useMemo(() => {
    const list = Array.isArray(participations) ? [...participations] : [];
    return list.sort((a, b) => {
      const ay = Number(a.year || 0);
      const by = Number(b.year || 0);
      if (by !== ay) return by - ay;
      return String(a.eventName || "").localeCompare(String(b.eventName || ""));
    });
  }, [participations]);

  if (rows.length === 0) {
    return (
      <div className="ucef-card rounded-2xl p-6 text-slate-600">
        No participation history yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {rows.map((p) => {
        const chip = stateStyles[p.participationState] || stateStyles.Registered;

        return (
          <div
            key={p.eventId}
            className="ucef-card rounded-2xl p-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
          >
            <div className="min-w-0">
              <h3 className="line-clamp-1 text-lg font-semibold text-slate-900 md:text-xl">
                {p.eventName || "Untitled Event"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {p.club || "Unknown Club"} - {p.year || "-"}
              </p>

              {p.attendancePercentage !== null && p.attendancePercentage !== undefined && (
                <p className="mt-2 text-sm text-slate-700">
                  Attendance: <b>{p.attendancePercentage}%</b>
                </p>
              )}

              {p.explanation && (
                <p className="mt-2 whitespace-pre-line text-sm italic text-slate-500">
                  {p.explanation}
                </p>
              )}
            </div>

            <span
              className={`shrink-0 rounded-full border px-4 py-1 text-sm font-semibold ${chip}`}
            >
              {p.participationState || "Registered"}
            </span>
          </div>
        );
      })}
    </section>
  );
}
