// Audience-feedback closed-loop insights panel (ADR-0047).
//
// The visible punchline of the May 9 demo. Shows audience signal
// streaming in (themes color-coded by category), an in-app feedback
// form for the room, and a "regenerate next episode with audience
// feedback" CTA that previews the brief-diff before triggering.
//
// All copy + colors come from brand.copy.* and brand.uiPalette.* per
// the agnostic contract. Themes color-code by category:
//   - signal-good  (matcha for wellness, cyan for cyber): accepted
//                   feedback + topic_request
//   - signal-alarm (oxblood for wellness, threat-red for cyber):
//                   criticism + controversy
//   - muted neutral for style_note
//   - off_topic + abuse never displayed (server-side filter)

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useBrand } from "../theme/BrandThemeProvider";
import {
    fetchEpisodeFeedback,
    fetchFeedbackAggregate,
    submitFeedback,
    inheritFeedback,
} from "../api/client";
import type {
    EpisodeSummary,
    FeedbackTheme,
    FeedbackThemeCategory,
    FeedbackAggregateResponse,
    InheritFeedbackResponse,
} from "../api/types";

interface Props {
    episode: EpisodeSummary;
}

const POLL_MS = 6000;

export function InsightsPanel({ episode }: Props) {
    const { brand } = useBrand();
    const [themes, setThemes] = useState<FeedbackTheme[] | null>(null);
    const [aggregate, setAggregate] = useState<FeedbackAggregateResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [authorLabel, setAuthorLabel] = useState("");
    const [diff, setDiff] = useState<InheritFeedbackResponse | null>(null);
    const [diffOpen, setDiffOpen] = useState(false);

    // Initial + polling fetch
    const refresh = useCallback(async () => {
        try {
            const [list, agg] = await Promise.all([
                fetchEpisodeFeedback(episode.id),
                fetchFeedbackAggregate(episode.id),
            ]);
            setThemes(list.themes);
            setAggregate(agg);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    }, [episode.id]);

    useEffect(() => {
        refresh();
        const t = setInterval(refresh, POLL_MS);
        return () => clearInterval(t);
    }, [refresh]);

    const onSubmit = async () => {
        if (!feedbackText.trim()) return;
        setSubmitting(true);
        try {
            const result = await submitFeedback(
                episode.id,
                feedbackText.trim(),
                authorLabel.trim() || undefined,
            );
            const themeWord = result.themesInserted === 1 ? "theme" : "themes";
            toast.success(
                `Feedback received — ${result.themesInserted} ${themeWord} extracted`,
            );
            setFeedbackText("");
            // immediate refresh so the new theme(s) show up without waiting for poll
            await refresh();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : String(err));
        } finally {
            setSubmitting(false);
        }
    };

    const onRegenerateClick = async () => {
        try {
            const lessons = await inheritFeedback(episode.id);
            setDiff(lessons);
            setDiffOpen(true);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : String(err));
        }
    };

    if (!brand) return null;

    return (
        <section className="border-b border-brand-line">
            <div className="mx-auto max-w-[1280px] px-9 py-14">
                <SectionHeader aggregate={aggregate} insightsTitle={brand.copy.insightsTitle} />

                {error ? (
                    <ErrorBanner message={error} />
                ) : (
                    <div className="grid lg:grid-cols-[1.4fr_1fr] gap-14">
                        <ThemesList themes={themes} />
                        <FeedbackForm
                            episodeId={episode.id}
                            feedbackPrompt={brand.copy.feedbackPrompt}
                            feedbackPlaceholder={brand.copy.feedbackPlaceholder}
                            feedbackSubmit={brand.copy.feedbackSubmit}
                            value={feedbackText}
                            authorValue={authorLabel}
                            onValueChange={setFeedbackText}
                            onAuthorChange={setAuthorLabel}
                            onSubmit={onSubmit}
                            submitting={submitting}
                        />
                    </div>
                )}

                {/* Regenerate CTA — only when there's something to inherit */}
                {aggregate && aggregate.themeCount > 0 && (
                    <RegenerateBlock
                        regenerateTitle={brand.copy.regenerateTitle}
                        regenerateSub={brand.copy.regenerateSub}
                        regenerateCta={brand.copy.regenerateCta}
                        themeCount={aggregate.themeCount}
                        onClick={onRegenerateClick}
                    />
                )}

                <AnimatePresence>
                    {diffOpen && diff && (
                        <BriefDiffModal diff={diff} onClose={() => setDiffOpen(false)} />
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

// ============================================================
// Section header
// ============================================================

function SectionHeader({
    aggregate,
    insightsTitle,
}: {
    aggregate: FeedbackAggregateResponse | null;
    insightsTitle: string;
}) {
    return (
        <div
            className="flex justify-between items-baseline pb-7 mb-9 border-b border-brand-line"
            style={{ fontFamily: "var(--brand-font-mono)" }}
        >
            <div>
                <div className="text-[0.7rem] uppercase tracking-[0.18em] text-brand-muted">
                    02 / Audience signal
                </div>
                <h2
                    className="mt-2 text-[2.4rem] leading-none italic font-light tracking-tight text-brand-fg"
                    style={{ fontFamily: "var(--brand-font-display)" }}
                >
                    {insightsTitle}
                </h2>
            </div>
            <span
                className="hidden md:inline text-[0.65rem] uppercase tracking-[0.14em] text-brand-muted"
                style={{ fontFamily: "var(--brand-font-mono)" }}
            >
                {aggregate
                    ? `${aggregate.feedbackCount} signals · ${aggregate.themeCount} themes · Gemini Flash`
                    : "Listening …"}
            </span>
        </div>
    );
}

// ============================================================
// Themes list
// ============================================================

function ThemesList({ themes }: { themes: FeedbackTheme[] | null }) {
    if (themes === null) {
        return <SkeletonThemes />;
    }
    if (themes.length === 0) {
        return (
            <div
                className="border border-dashed border-brand-line p-10 text-center text-sm italic text-brand-muted"
                style={{ fontFamily: "var(--brand-font-display)" }}
            >
                No audience signal yet. Send the first feedback →
            </div>
        );
    }
    return (
        <ul className="flex flex-col gap-3.5">
            <AnimatePresence initial={false}>
                {themes.map((theme, i) => (
                    <ThemeCard key={theme.id} theme={theme} index={i} />
                ))}
            </AnimatePresence>
        </ul>
    );
}

function SkeletonThemes() {
    return (
        <ul className="flex flex-col gap-3.5">
            {[0, 1, 2].map((i) => (
                <li
                    key={i}
                    className="grid grid-cols-[56px_1fr_auto] gap-5 items-center px-5 py-5 border border-brand-line bg-brand-surface animate-pulse"
                    style={{ borderLeft: "4px solid var(--brand-line)" }}
                >
                    <div className="h-7 w-10 bg-brand-line/40 rounded" />
                    <div className="h-5 w-3/4 bg-brand-line/30 rounded" />
                    <div className="h-4 w-16 bg-brand-line/30 rounded" />
                </li>
            ))}
        </ul>
    );
}

// ============================================================
// ThemeCard — one row per extracted theme
// ============================================================

const CATEGORY_DISPLAY: Record<
    FeedbackThemeCategory,
    { label: string; accent: "good" | "alarm" | "neutral" }
> = {
    accepted:       { label: "Accepted",     accent: "good" },
    topic_request:  { label: "Topic request", accent: "good" },
    criticism:      { label: "Criticism",    accent: "alarm" },
    controversy:    { label: "Controversy",  accent: "alarm" },
    style_note:     { label: "Style note",   accent: "neutral" },
    off_topic:      { label: "Off-topic",    accent: "neutral" },
    abuse:          { label: "Abuse",        accent: "alarm" },
};

function ThemeCard({ theme, index }: { theme: FeedbackTheme; index: number }) {
    const display = CATEGORY_DISPLAY[theme.category];
    const accentVar =
        display.accent === "good"
            ? "var(--brand-signal-good)"
            : display.accent === "alarm"
                ? "var(--brand-signal-alarm)"
                : "var(--brand-muted)";

    return (
        <motion.li
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.04 * Math.min(index, 5), ease: "easeOut" }}
            className="grid grid-cols-[auto_1fr_auto] gap-5 items-center px-5 py-5 bg-brand-surface border border-brand-line transition-transform hover:translate-x-0.5"
            style={{ borderLeft: `4px solid ${accentVar}` }}
        >
            {/* Sentiment glyph (small dot) */}
            <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                    background:
                        theme.sentiment === "positive"
                            ? "var(--brand-signal-good)"
                            : theme.sentiment === "negative"
                                ? "var(--brand-signal-alarm)"
                                : "var(--brand-muted)",
                }}
                aria-label={theme.sentiment}
            />

            {/* Label + optional detail */}
            <div className="min-w-0">
                <div
                    className="text-[1.1rem] leading-tight italic"
                    style={{ fontFamily: "var(--brand-font-display)", color: "var(--brand-fg)" }}
                >
                    {theme.themeLabel}
                </div>
                {theme.themeDetail && (
                    <div
                        className="mt-1 text-[0.85rem] leading-snug text-brand-fg-soft"
                        style={{ fontFamily: "var(--brand-font-body)" }}
                    >
                        {theme.themeDetail}
                    </div>
                )}
                {theme.requestedTopic && (
                    <div
                        className="mt-1 text-[0.7rem] uppercase tracking-[0.14em]"
                        style={{
                            color: "var(--brand-signal-good)",
                            fontFamily: "var(--brand-font-mono)",
                        }}
                    >
                        Wants: {theme.requestedTopic}
                    </div>
                )}
            </div>

            {/* Category tag */}
            <span
                className="text-[0.6rem] uppercase tracking-[0.16em] px-2 py-1 border whitespace-nowrap"
                style={{
                    fontFamily: "var(--brand-font-mono)",
                    color: accentVar,
                    borderColor: accentVar,
                    fontWeight: 600,
                }}
            >
                {display.label}
            </span>
        </motion.li>
    );
}

// ============================================================
// FeedbackForm — in-app form ingestion
// ============================================================

function FeedbackForm({
    episodeId,
    feedbackPrompt,
    feedbackPlaceholder,
    feedbackSubmit,
    value,
    authorValue,
    onValueChange,
    onAuthorChange,
    onSubmit,
    submitting,
}: {
    episodeId: string;
    feedbackPrompt: string;
    feedbackPlaceholder: string;
    feedbackSubmit: string;
    value: string;
    authorValue: string;
    onValueChange: (v: string) => void;
    onAuthorChange: (v: string) => void;
    onSubmit: () => void;
    submitting: boolean;
}) {
    const url = `${window.location.origin}/feedback/${episodeId}`;
    return (
        <aside className="border border-brand-fg bg-brand-bg p-7">
            {/* QR placeholder block */}
            <div className="mb-5 aspect-square bg-brand-fg flex items-center justify-center p-4">
                <span
                    className="text-[0.6rem] uppercase tracking-[0.18em]"
                    style={{
                        fontFamily: "var(--brand-font-mono)",
                        color: "var(--brand-bg)",
                    }}
                >
                    QR · {url.replace(/^https?:\/\//, "")}
                </span>
            </div>
            <div
                className="text-[1.2rem] leading-tight italic mb-2"
                style={{ fontFamily: "var(--brand-font-display)", color: "var(--brand-fg)" }}
            >
                {feedbackPrompt}
            </div>
            <textarea
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={feedbackPlaceholder}
                rows={4}
                className="w-full mt-3 border border-brand-line bg-brand-surface px-4 py-3 text-sm placeholder:italic placeholder:text-brand-muted resize-y"
                style={{
                    color: "var(--brand-fg)",
                    fontFamily: "var(--brand-font-body)",
                }}
                disabled={submitting}
            />
            <input
                type="text"
                value={authorValue}
                onChange={(e) => onAuthorChange(e.target.value)}
                placeholder="Name (optional)"
                className="w-full mt-2 border border-brand-line bg-brand-surface px-4 py-2 text-sm placeholder:italic placeholder:text-brand-muted"
                style={{
                    color: "var(--brand-fg)",
                    fontFamily: "var(--brand-font-body)",
                }}
                disabled={submitting}
            />
            <button
                type="button"
                onClick={onSubmit}
                disabled={submitting || !value.trim()}
                className="w-full mt-3 px-5 py-3 uppercase tracking-[0.18em] text-[0.7rem] font-semibold border border-brand-fg transition-colors hover:bg-brand-fg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                    fontFamily: "var(--brand-font-mono)",
                    background: "transparent",
                    color: "var(--brand-fg)",
                }}
            >
                {submitting ? "Sending …" : feedbackSubmit}
            </button>
        </aside>
    );
}

// ============================================================
// RegenerateBlock — the closed-loop CTA
// ============================================================

function RegenerateBlock({
    regenerateTitle,
    regenerateSub,
    regenerateCta,
    themeCount,
    onClick,
}: {
    regenerateTitle: string;
    regenerateSub: string;
    regenerateCta: string;
    themeCount: number;
    onClick: () => void;
}) {
    // The title may contain [em-primary]/[em-secondary] tokens — render
    // them in brand-primary / brand-secondary the same way CopyEm does.
    const renderTitle = (title: string) => {
        const parts: Array<{ text: string; em?: "primary" | "secondary" }> = [];
        const re = /\[(em-primary|em-secondary)\]([\s\S]*?)\[\/\1\]/g;
        let lastIndex = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(title)) !== null) {
            if (m.index > lastIndex) parts.push({ text: title.slice(lastIndex, m.index) });
            parts.push({
                text: m[2],
                em: m[1] === "em-primary" ? "primary" : "secondary",
            });
            lastIndex = m.index + m[0].length;
        }
        if (lastIndex < title.length) parts.push({ text: title.slice(lastIndex) });
        return parts.map((p, i) =>
            p.em ? (
                <em
                    key={i}
                    style={{
                        fontStyle: "italic",
                        color:
                            p.em === "primary"
                                ? "var(--brand-primary)"
                                : "var(--brand-secondary)",
                    }}
                >
                    {p.text}
                </em>
            ) : (
                <span key={i}>{p.text}</span>
            ),
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mt-16 p-14 relative overflow-hidden"
            style={{
                border: "2px solid var(--brand-primary)",
                background:
                    "linear-gradient(135deg, var(--brand-surface) 0%, var(--brand-surface2) 100%)",
            }}
        >
            <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10 items-center">
                <div>
                    <div
                        className="text-[0.7rem] uppercase tracking-[0.18em] mb-3"
                        style={{
                            fontFamily: "var(--brand-font-mono)",
                            color: "var(--brand-primary)",
                        }}
                    >
                        03 / The closed loop
                    </div>
                    <h3
                        className="leading-[1.05] tracking-tight"
                        style={{
                            fontFamily: "var(--brand-font-display)",
                            fontSize: "clamp(36px, 4vw, 56px)",
                            fontWeight: 350,
                            color: "var(--brand-fg)",
                        }}
                    >
                        {renderTitle(regenerateTitle)}
                    </h3>
                    <p
                        className="mt-4 text-[1.05rem] italic max-w-[480px]"
                        style={{
                            fontFamily: "var(--brand-font-display)",
                            fontWeight: 300,
                            color: "var(--brand-fg-soft)",
                        }}
                    >
                        {regenerateSub}
                    </p>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={onClick}
                        className="group inline-flex items-center justify-center gap-3.5 w-full px-7 py-5 uppercase tracking-[0.18em] text-[0.78rem] font-semibold transition-all hover:translate-y-[-1px]"
                        style={{
                            fontFamily: "var(--brand-font-mono)",
                            background: "var(--brand-primary)",
                            color: "var(--brand-bg)",
                        }}
                    >
                        <span>{regenerateCta}</span>
                        <span
                            className="transition-transform group-hover:translate-x-0.5 text-[1.4rem] leading-none"
                            style={{ fontFamily: "var(--brand-font-display)" }}
                        >
                            →
                        </span>
                    </button>
                    <div
                        className="mt-3 text-center text-[0.62rem] uppercase tracking-[0.14em] text-brand-muted"
                        style={{ fontFamily: "var(--brand-font-mono)" }}
                    >
                        {themeCount} theme{themeCount === 1 ? "" : "s"} ready to inherit
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

// ============================================================
// BriefDiffModal — preview the audienceLessons block before generating
// ============================================================

function BriefDiffModal({
    diff,
    onClose,
}: {
    diff: InheritFeedbackResponse;
    onClose: () => void;
}) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-fg/40 backdrop-blur-sm flex items-center justify-center p-6 overflow-y-auto"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full max-w-[820px] bg-brand-bg border border-brand-fg p-8 my-10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-baseline mb-5">
                    <div>
                        <div
                            className="text-[0.65rem] uppercase tracking-[0.18em] text-brand-primary mb-2"
                            style={{ fontFamily: "var(--brand-font-mono)" }}
                        >
                            Brief · diff vs. previous episode
                        </div>
                        <h3
                            className="text-[1.6rem] italic leading-tight"
                            style={{
                                fontFamily: "var(--brand-font-display)",
                                color: "var(--brand-fg)",
                            }}
                        >
                            {diff.summary}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[1.5rem] leading-none px-2 py-1 hover:opacity-60"
                        style={{ color: "var(--brand-fg)" }}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <pre
                    className="border border-brand-line p-5 bg-brand-surface text-[0.78rem] leading-[1.7] overflow-x-auto whitespace-pre-wrap"
                    style={{
                        fontFamily: "var(--brand-font-mono)",
                        color: "var(--brand-fg-soft)",
                    }}
                >
                    {diff.audienceLessons || "(no audience signal yet)"}
                </pre>
                <div
                    className="mt-4 flex justify-end gap-3 text-[0.7rem] uppercase tracking-[0.18em]"
                    style={{ fontFamily: "var(--brand-font-mono)" }}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 border border-brand-line text-brand-fg-soft hover:bg-brand-surface"
                    >
                        Close
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            toast.success(
                                "Brief inheritance ready. Wire to script-generator next.",
                            );
                        }}
                        className="px-5 py-2.5 font-semibold"
                        style={{
                            background: "var(--brand-primary)",
                            color: "var(--brand-bg)",
                        }}
                    >
                        Generate next episode →
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ============================================================
// ErrorBanner
// ============================================================

function ErrorBanner({ message }: { message: string }) {
    return (
        <div
            className="border border-brand-line bg-brand-surface p-4 text-sm"
            style={{ fontFamily: "var(--brand-font-mono)" }}
        >
            <span className="text-brand-signal-alarm">[insights-fetch failed]</span>
            <span className="ml-2 text-brand-muted">{message}</span>
        </div>
    );
}
