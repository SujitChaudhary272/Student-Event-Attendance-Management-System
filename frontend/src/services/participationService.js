import axios from "axios";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const fetchMyParticipation = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${BACKEND}/api/students/me/participation`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const fetchLiveEvents = async () => {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${BACKEND}/api/students/events/live`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
};

export const registerForLiveEvent = async ({ clubId, eventId, profile }) => {
  const token = localStorage.getItem("token");
  const res = await axios.post(
    `${BACKEND}/api/students/clubs/${clubId}/events/${eventId}/register`,
    {
      rollNo: profile?.roll_no || profile?.rollNo || "",
      department: profile?.department || "",
      phone: profile?.phone || "",
      gender: profile?.gender || "",
      year: profile?.year || "",
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  return res.data;
};
