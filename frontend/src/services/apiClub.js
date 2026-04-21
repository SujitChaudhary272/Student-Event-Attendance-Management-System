const BASE_URL = "http://localhost:5000/api/public";

export const getAllClubs = async () => {
  const res = await fetch(`${BASE_URL}/clubs`);
  return res.json();
};

export const getClubById = async (clubId) => {
  const res = await fetch(`${BASE_URL}/clubs/${clubId}`);
  return res.json();
};
