import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/admin`;
const PUBLIC_API = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/public`;

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const monthLabel = (dateValue) =>
  new Date(dateValue).toLocaleString("en-US", { month: "short" });

const buildMonthlyEvents = (events) => {
  const monthlyMap = new Map();

  events.forEach((event) => {
    if (!event?.start_time) return;
    const label = monthLabel(event.start_time);
    monthlyMap.set(label, (monthlyMap.get(label) || 0) + 1);
  });

  return Array.from(monthlyMap.entries()).map(([month, count]) => ({
    month,
    events: count,
  }));
};

const fetchDashboardStatsFallback = async () => {
  const clubsRes = await axios.get(`${API}/clubs`, authConfig());
  const clubs = clubsRes.data || [];

  const eventResponses = await Promise.all(
    clubs.map((club) => axios.get(`${PUBLIC_API}/clubs/${club.id}/events`))
  );

  const allEvents = eventResponses.flatMap((response) => response.data || []);

  return {
    totalClubs: clubs.length,
    totalEvents: allEvents.length,
    activeEvents: allEvents.filter((event) => event.status === "Live").length,
    monthlyEvents: buildMonthlyEvents(allEvents),
  };
};

export const fetchDashboardStats = async () => {
  try {
    const res = await axios.get(`${API}/dashboard/stats`, authConfig());
    return res.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      return fetchDashboardStatsFallback();
    }
    throw error;
  }
};

export const fetchClubs = async () => {
  const res = await axios.get(`${API}/clubs`, authConfig());
  return res.data;
};

export const createClub = async (formData) => {
  const res = await axios.post(`${API}/clubs`, formData, authConfig());
  return res.data;
};

export const toggleClub = async (id) => {
  await axios.put(`${API}/clubs/${id}/toggle`, {}, authConfig());
};
