import axios from "axios";

const API = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}/api/admin/members`;

const authConfig = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export const fetchMembers = async () => {
  const res = await axios.get(API, authConfig());
  return res.data;
};

export const fetchMembersByClub = async (clubId) => {
  const res = await axios.get(`${API}/club/${clubId}`, authConfig());
  return res.data;
};

export const createMember = async (data) => {
  const res = await axios.post(API, data, authConfig());
  return res.data;
};

export const updateMemberRole = async (id, role) => {
  await axios.put(`${API}/${id}/role`, { role }, authConfig());
};

export const toggleMember = async (id) => {
  await axios.put(`${API}/${id}/toggle`, {}, authConfig());
};
