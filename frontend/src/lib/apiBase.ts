/** Backend origin without trailing slash. Set `VITE_API_BASE_URL` in `.env` (see `.env.example`). */
export const API_BASE = String(import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
