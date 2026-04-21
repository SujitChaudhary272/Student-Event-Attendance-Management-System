import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../../services/apiClient";

export default function AdminReports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const data = await apiRequest("/reports");
        setReports(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load reports");
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  return (
    <div className="ucef-page-shell px-6 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="ucef-back-btn mb-6"
      >
        <span aria-hidden="true">←</span>
        <span>Back</span>
      </button>

      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-400">
          Admin Reports
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">Student Reports</h1>
        <p className="mt-2 text-slate-500">
          Live event reporting pulled from the backend reporting view.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
          {error}
        </div>
      )}

      <div className="ucef-table">
        <table className="w-full text-sm">
          <thead className="bg-blue-50/70 text-slate-600">
            <tr>
              <th className="px-4 py-4 text-left">Event</th>
              <th className="px-4 py-4 text-left">Status</th>
              <th className="px-4 py-4 text-left">Start</th>
              <th className="px-4 py-4 text-left">End</th>
              <th className="px-4 py-4 text-left">Registrations</th>
              <th className="px-4 py-4 text-left">Attended</th>
              <th className="px-4 py-4 text-left">Certified</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              reports.map((report) => (
                <tr key={report.event_id} className="border-t border-slate-100 transition hover:bg-blue-50/30">
                  <td className="px-4 py-4 font-medium text-slate-900">{report.title}</td>
                  <td className="px-4 py-4 text-slate-600">{report.status}</td>
                  <td className="px-4 py-4 text-slate-600">
                    {report.start_time ? new Date(report.start_time).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">
                    {report.end_time ? new Date(report.end_time).toLocaleString() : "-"}
                  </td>
                  <td className="px-4 py-4 text-slate-600">{report.registrations}</td>
                  <td className="px-4 py-4 text-slate-600">{report.attended}</td>
                  <td className="px-4 py-4 text-slate-600">{report.certified}</td>
                </tr>
              ))}
          </tbody>
        </table>

        {loading && <p className="px-4 py-6 text-slate-500">Loading reports...</p>}
        {!loading && !reports.length && !error && (
          <p className="px-4 py-6 text-slate-500">No report data available yet.</p>
        )}
      </div>
    </div>
  );
}
