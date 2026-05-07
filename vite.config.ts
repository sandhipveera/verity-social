import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Verity-social — the agnostic platform UI (ADR-0046).
//
// Talks to `verity-core` over HTTP only — no shared TS imports across
// repo boundaries. The contract lives at:
//   GET /api/brand/current?host=<host>
//   GET /api/domain/current?host=<host>
//
// At dev time we proxy /api/* to verity-core (local or production),
// configurable via the VITE_API_BASE env var.

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), "");
    const apiBase = env.VITE_API_BASE ?? "https://api.verity.accessquint.com";

    return {
        plugins: [react(), tailwindcss()],
        server: {
            port: 5174, // verity-ui used 5173; keep this distinct
            proxy: {
                "/api": {
                    target: apiBase,
                    changeOrigin: true,
                    secure: true,
                },
            },
        },
    };
});
