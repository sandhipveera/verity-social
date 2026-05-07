// Brand-themed episode list — agnostic UI per ADR-0046.
// Every visible string + color comes from brand.copy / brand.uiPalette.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBrand } from "../theme/BrandThemeProvider";
import { fetchEpisodes } from "../api/client";
import type { EpisodeSummary } from "../api/types";

export function EpisodeList() {
    const { brand } = useBrand();
    const [episodes, setEpisodes] = useState<EpisodeSummary[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const list = await fetchEpisodes();
                if (cancelled) return;
                // Show most-recent first
                list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
                setEpisodes(list);
            } catch (err) {
                if (cancelled) return;
                setError(err instanceof Error ? err.message : String(err));
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!brand) return null;

    return (
        <section className="border-b border-brand-line">
            <div className="mx-auto max-w-[1280px] px-9 py-14">
                <SectionHeader />
                {error ? (
                    <ErrorBanner message={error} />
                ) : episodes === null ? (
                    <EmptyState text={brand.copy.loading} />
                ) : episodes.length === 0 ? (
                    <EmptyState text={brand.copy.emptyEpisodes} />
                ) : (
                    <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {episodes.map((ep, i) => (
                            <EpisodeCard key={ep.id} episode={ep} index={i} />
                        ))}
                    </ul>
                )}
            </div>
        </section>
    );
}

function SectionHeader() {
    return (
        <div
            className="flex justify-between items-baseline pb-7 mb-9 border-b border-brand-line"
            style={{ fontFamily: "var(--brand-font-mono)" }}
        >
            <div>
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-brand-muted">
                    01 / Episodes
                </div>
                <h2
                    className="mt-2 text-[2.4rem] leading-none italic font-light tracking-tight text-brand-fg"
                    style={{ fontFamily: "var(--brand-font-display)" }}
                >
                    What you've made.
                </h2>
            </div>
        </div>
    );
}

function EpisodeCard({ episode, index }: { episode: EpisodeSummary; index: number }) {
    const { brand } = useBrand();
    if (!brand) return null;

    const status = episode.status;
    const isPublished = status === "published";
    const isFailed = status === "failed";
    const isWorking = !isPublished && !isFailed && status !== "ready_for_review";

    const statusLabel = (
        {
            draft: "Draft",
            research: "Researching",
            scripting: "Scripting",
            shots_planning: "Storyboarding",
            rendering: "Rendering",
            ready_for_review: "Ready",
            published: "Live",
            failed: "Failed",
            regenerating: "Regen",
        } as Record<EpisodeSummary["status"], string>
    )[status] ?? status;

    const channelLine = brand.youtubeChannelHandle
        ? brand.copy.channelLabelFormat
              .replace("{handle}", brand.youtubeChannelHandle)
        : "Channel";

    const accent = isFailed
        ? "var(--brand-signal-alarm)"
        : isPublished
            ? "var(--brand-primary)"
            : "var(--brand-secondary)";

    const href = isPublished && episode.youtubeUrl ? episode.youtubeUrl : undefined;
    const Wrapper: React.ElementType = href ? "a" : "div";

    return (
        <motion.li
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 * index, ease: "easeOut" }}
        >
            <Wrapper
                {...(href ? { href, target: "_blank", rel: "noopener noreferrer" } : {})}
                className="block border border-brand-line bg-brand-surface p-5 transition-all hover:translate-y-[-2px]"
                style={{ borderLeft: `4px solid ${accent}` }}
            >
                {/* Thumbnail / placeholder */}
                <div
                    className="aspect-[16/9] mb-4 relative overflow-hidden"
                    style={{
                        background: episode.thumbnailUrl
                            ? `url(${episode.thumbnailUrl}) center/cover`
                            : `linear-gradient(135deg, ${brand.uiPalette.surface2}, ${brand.uiPalette.surface})`,
                    }}
                >
                    {!episode.thumbnailUrl && (
                        <div
                            className="absolute inset-0 flex items-center justify-center text-2xl italic"
                            style={{
                                fontFamily: "var(--brand-font-display)",
                                color: "var(--brand-muted)",
                            }}
                        >
                            {isWorking ? "…" : episode.title.split(" ").slice(0, 2).join(" ")}
                        </div>
                    )}
                </div>

                {/* Tag / status */}
                <div
                    className="flex justify-between items-baseline mb-2 text-[0.62rem] uppercase tracking-[0.16em]"
                    style={{ fontFamily: "var(--brand-font-mono)" }}
                >
                    <span style={{ color: "var(--brand-muted)" }}>{channelLine}</span>
                    <span style={{ color: accent, fontWeight: 600 }}>{statusLabel}</span>
                </div>

                {/* Title */}
                <h3
                    className="text-[1.25rem] leading-[1.2] mb-2 italic font-normal text-brand-fg"
                    style={{ fontFamily: "var(--brand-font-display)" }}
                >
                    {episode.title}
                </h3>

                {/* Meta row */}
                <div
                    className="flex gap-4 text-[0.62rem] uppercase tracking-[0.16em]"
                    style={{
                        fontFamily: "var(--brand-font-mono)",
                        color: "var(--brand-muted)",
                    }}
                >
                    {episode.durationSeconds != null && (
                        <span>{formatDuration(episode.durationSeconds)}</span>
                    )}
                    <span>{formatDate(episode.createdAt)}</span>
                </div>
            </Wrapper>
        </motion.li>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div
            className="border border-dashed border-brand-line p-12 text-center text-sm italic"
            style={{
                color: "var(--brand-muted)",
                fontFamily: "var(--brand-font-display)",
            }}
        >
            {text}
        </div>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return (
        <div
            className="border border-brand-line bg-brand-surface p-4 text-sm"
            style={{ fontFamily: "var(--brand-font-mono)" }}
        >
            <span className="text-brand-signal-alarm">[episodes-fetch failed]</span>
            <span className="ml-2 text-brand-muted">{message}</span>
        </div>
    );
}

function formatDuration(s: number): string {
    const m = Math.floor(s / 60);
    const sec = Math.round(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
