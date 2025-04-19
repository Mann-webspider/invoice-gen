import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.js",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "file:./database.sqlite"
  }
} satisfies Config; 