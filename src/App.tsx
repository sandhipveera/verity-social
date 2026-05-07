import { useEffect, useState } from "react";
import { BrandThemeProvider, useBrand } from "./theme/BrandThemeProvider";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { BriefInput } from "./components/BriefInput";
import { EpisodeList } from "./components/EpisodeList";
import { InsightsPanel } from "./components/InsightsPanel";
import { fetchEpisodes } from "./api/client";
import type { EpisodeSummary } from "./api/types";
import { Toaster } from "sonner";

function Footer() {
    const { brand, domain } = useBrand();
    return (
        <footer
            className="border-t border-brand-line mt-16"
            style={{ fontFamily: "var(--brand-font-mono)" }}
        >
            <div className="mx-auto max-w-[1280px] px-9 py-8 flex justify-between items-center text-[0.65rem] uppercase tracking-[0.16em] text-brand-muted">
                <span>
                    {brand?.name ?? "verity"}
                    {domain && <> · {domain.complianceLensLabel ?? domain.name}</>}
                </span>
                <span>Industry-agnostic platform · ADR-0046</span>
            </div>
        </footer>
    );
}

function FetchError() {
    const { error } = useBrand();
    if (!error) return null;
    return (
        <div className="mx-auto max-w-[1280px] px-9 py-3">
            <div
                className="border border-brand-line bg-brand-surface px-4 py-3 text-sm"
                style={{ fontFamily: "var(--brand-font-mono)" }}
            >
                <span className="text-brand-signal-alarm">[brand-fetch failed]</span>
                <span className="ml-2 text-brand-muted">{error}</span>
                <span className="ml-2 text-brand-muted">
                    — using fallback theme. Set VITE_API_BASE to your verity-core URL.
                </span>
            </div>
        </div>
    );
}

/**
 * Picks the most-relevant episode for the closed-loop insights panel —
 * preference order: most-recently-published > most-recently-created.
 * For the May 9 demo this is "the wellness Episode 1" by construction;
 * post-event it's whatever brand owner just shipped.
 */
function pickActiveEpisode(eps: EpisodeSummary[]): EpisodeSummary | null {
    if (eps.length === 0) return null;
    const published = eps
        .filter((e) => e.status === "published" && e.publishedAt)
        .sort((a, b) =>
            (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""),
        );
    if (published[0]) return published[0];
    const sorted = [...eps].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
    );
    return sorted[0];
}

function ActiveInsights() {
    const [active, setActive] = useState<EpisodeSummary | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const eps = await fetchEpisodes();
                if (cancelled) return;
                setActive(pickActiveEpisode(eps));
            } catch {
                // EpisodeList will surface fetch errors separately
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    if (!active) return null;
    return <InsightsPanel episode={active} />;
}

function Shell() {
    return (
        <>
            <Header />
            <FetchError />
            <main>
                <Hero />
                <BriefInput />
                <EpisodeList />
                <ActiveInsights />
            </main>
            <Footer />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "var(--brand-surface)",
                        color: "var(--brand-fg)",
                        border: "1px solid var(--brand-line)",
                        fontFamily: "var(--brand-font-body)",
                    },
                }}
            />
        </>
    );
}

function App() {
    return (
        <BrandThemeProvider>
            <Shell />
        </BrandThemeProvider>
    );
}

export default App;
