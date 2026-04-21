const API = "http://localhost:5000/api/organizers";

const authHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("organizerToken")}`,
  "Content-Type": "application/json",
});

export const organizerLogin = async (payload) => {
  const res = await fetch(`${API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
};

export const fetchMyOrganizerProfile = async () => {
  const res = await fetch(`${API}/profile`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
};

export const fetchMyClubEvents = async () => {
  const res = await fetch(`${API}/events`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Unauthorized");
  return res.json();
};

export const createMyClubEvent = async (data) => {
  const res = await fetch(`${API}/events`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateMyEventStatus = async (eventId, status) => {
  const res = await fetch(`${API}/events/${eventId}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  return res.json();
};

export const deleteMyClubEvent = async (eventId) => {
  const res = await fetch(`${API}/events/${eventId}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};

export const openAttendance = async (eventId) => {
  const res = await fetch(`${API}/events/${eventId}/attendance/open`, {
    method: "POST",
    headers: authHeaders(),
  });
  return res.json();
};

export const fetchEventParticipants = async (eventId, day) => {
  const qs = day ? `?day=${encodeURIComponent(day)}` : "";
  const res = await fetch(`${API}/events/${eventId}/participants${qs}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to fetch participants");
  return res.json();
};

export const downloadEventAttendancePdf = async (eventId, day) => {
  const qs = day ? `?day=${encodeURIComponent(day)}` : "";
  const res = await fetch(`${API}/events/${eventId}/participants/download${qs}`, {
    headers: authHeaders(),
  });

  if (!res.ok) throw new Error("Failed to download attendance PDF");
  return res.blob();
};

export const setManualAttendance = async (eventId, student_id, status, day) => {
  const res = await fetch(`${API}/events/${eventId}/attendance/manual`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ student_id, status, day }),
  });

  if (!res.ok) throw new Error("Failed to update attendance");
  return res.json();
};

export const issueCertificate = async (eventId, student_id) => {
  const res = await fetch(`${API}/events/${eventId}/certificates/issue`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ student_id }),
  });

  if (!res.ok) throw new Error("Failed to issue certificate");
  return res.json();
};

export const openEventQr = async (eventId, qr_type, day) => {
  const res = await fetch(`${API}/events/${eventId}/qr/open`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ qr_type, day }),
  });

  if (!res.ok) throw new Error("Failed to open QR");
  return res.json();
};
