/** Backend origin without trailing slash. Set VITE_API_BASE_URL in env files. */
const configuredBase = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/$/, "");

const isBrowser = typeof window !== "undefined";
const isHostedEnvironment =
	isBrowser &&
	window.location.hostname !== "localhost" &&
	window.location.hostname !== "127.0.0.1";

const pointsToLocalhost = /localhost|127\.0\.0\.1/i.test(configuredBase);

// Guard against shipping localhost API base in production builds.
export const API_BASE = isHostedEnvironment && pointsToLocalhost ? "" : configuredBase;
