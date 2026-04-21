import { pool } from "../config/db.js";

const schemaCache = new Map();

export async function hasTable(tableName) {
  const key = `table:${tableName}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = $1
    ) AS exists
    `,
    [tableName]
  );

  const exists = result.rows[0]?.exists === true;
  schemaCache.set(key, exists);
  return exists;
}

export async function hasColumn(tableName, columnName) {
  const key = `column:${tableName}.${columnName}`;
  if (schemaCache.has(key)) return schemaCache.get(key);

  const result = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
        AND column_name = $2
    ) AS exists
    `,
    [tableName, columnName]
  );

  const exists = result.rows[0]?.exists === true;
  schemaCache.set(key, exists);
  return exists;
}

export async function getStudentUserTable() {
  if (await hasTable("users")) return "users";
  if (await hasTable("students")) return "students";
  return "users";
}
