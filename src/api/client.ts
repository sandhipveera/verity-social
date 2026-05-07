// Verity-core API client. Talks to verity-core only — no shared
// imports. Per ADR-0046 the agnostic contract lives at:
//   GET /api/brand/current?host=<host>
//   GET /api/domain/current?host=<host>
//
// Both endpoints fall through to the platform default on unknown
// hostnames, so this client never receives 404 from a brand miss.

import type {
    BrandCurrent,
    DomainCurrent,
    EpisodeSummary,
    FeedbackListResponse,
    FeedbackAggregateResponse,
    InheritFeedbackResponse,
    SubmitFeedbackResponse,
} from "./types";

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

export async function fetchEpisodes(): Promise<EpisodeSummary[]> {
    // verity-core returns { episodes: [...] }; unwrap to a flat array.
    const wire = await getJson<{ episodes: EpisodeSummary[] }>("/api/episodes");
    return wire.episodes ?? [];
}

// ============================================================
// Audience-feedback closed loop
// ============================================================

async function postJson<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(url(path), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "omit",
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        let errMsg = `POST ${path} failed: ${res.status} ${res.statusText}`;
        try {
            const err = await res.json();
            if (err?.error) errMsg = `${errMsg} — ${err.error}`;
        } catch {
            // ignore JSON parse failure
        }
        throw new Error(errMsg);
    }
    return (await res.json()) as T;
}

export async function fetchEpisodeFeedback(
    episodeId: string,
    options: { since?: string; categories?: string[] } = {},
): Promise<FeedbackListResponse> {
    const params: Record<string, string> = {};
    if (options.since) params.since = options.since;
    if (options.categories?.length) params.categories = options.categories.join(",");
    return getJson<FeedbackListResponse>(`/api/episodes/${episodeId}/feedback`, params);
}

export async function fetchFeedbackAggregate(
    episodeId: string,
): Promise<FeedbackAggregateResponse> {
    return getJson<FeedbackAggregateResponse>(
        `/api/episodes/${episodeId}/feedback/themes/aggregate`,
    );
}

export async function submitFeedback(
    episodeId: string,
    text: string,
    authorLabel?: string,
): Promise<SubmitFeedbackResponse> {
    return postJson<SubmitFeedbackResponse>(`/api/episodes/${episodeId}/feedback`, {
        text,
        authorLabel,
    });
}

export async function refreshYouTubeComments(
    episodeId: string,
): Promise<{ fetched: number; inserted: number; themesExtracted: number }> {
    return postJson<{ fetched: number; inserted: number; themesExtracted: number }>(
        `/api/episodes/${episodeId}/refresh-youtube-comments`,
        {},
    );
}

export async function inheritFeedback(
    episodeId: string,
): Promise<InheritFeedbackResponse> {
    return postJson<InheritFeedbackResponse>(
        `/api/episodes/${episodeId}/inherit-feedback`,
        {},
    );
}
