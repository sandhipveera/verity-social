// Verity-core API client. Talks to verity-core only — no shared
// imports. Per ADR-0046 the agnostic contract lives at:
//   GET /api/brand/current?host=<host>
//   GET /api/domain/current?host=<host>
//
// Both endpoints fall through to the platform default on unknown
// hostnames, so this client never receives 404 from a brand miss.

import type { BrandCurrent, DomainCurrent } from "./types";

const API_BASE = (import.meta.env.VITE_API_BASE ?? "").replace(/\/$/, "");

function url(path: string, params?: Record<string, string>): string {
    const u = new URL(path, API_BASE || window.location.origin);
    if (params) {
        for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    }
    return u.toString();
}

async function getJson<T>(path: string, params?: Record<string, string>): Promise<T> {
    const res = await fetch(url(path, params), {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "omit",
    });
    if (!res.ok) {
        throw new Error(`GET ${path} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
}

export async function fetchBrandCurrent(host?: string): Promise<BrandCurrent> {
    const h = host ?? window.location.host;
    return getJson<BrandCurrent>("/api/brand/current", { host: h });
}

export async function fetchDomainCurrent(host?: string): Promise<DomainCurrent> {
    const h = host ?? window.location.host;
    return getJson<DomainCurrent>("/api/domain/current", { host: h });
}
