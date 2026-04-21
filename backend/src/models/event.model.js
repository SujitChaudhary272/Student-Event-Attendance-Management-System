import { query } from "../config/db.js";

export const createEvent = async (data) => {
  const { title, description, event_type, organizer_id, start_time, end_time } = data;

  const result = await query(
    `INSERT INTO events (title, description, event_type, organizer_id, start_time, end_time, status)
     VALUES ($1,$2,$3,$4,$5,$6,'Draft')
     RETURNING *`,
    [title, description, event_type, organizer_id, start_time, end_time]
  );
  return result.rows[0];
};

export const getAllEvents = async () => {
  const result = await query(
    `SELECT e.*, u.name AS organizer
     FROM events e
     LEFT JOIN users u ON e.organizer_id = u.id
     ORDER BY start_time`
  );
  return result.rows;
};

export const getEventById = async (id) => {
  const result = await query(
    `SELECT * FROM events WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const updateEventStatus = async (eventId, status) => {
  const result = await query(
    `UPDATE events SET status = $1 WHERE id = $2 RETURNING *`,
    [status, eventId]
  );
  return result.rows[0];
};
