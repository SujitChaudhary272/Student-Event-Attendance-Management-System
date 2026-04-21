import app from "./app.js";
import { env } from "./config/env.js";
import { initializeDatabase, pool } from "./config/db.js";

const PORT = env.PORT || 5000;

const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log("PostgreSQL connected successfully");
    client.release();

    await initializeDatabase();
    console.log("Database schema is ready");
  } catch (err) {
    console.error("Failed to initialize PostgreSQL:", err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();
