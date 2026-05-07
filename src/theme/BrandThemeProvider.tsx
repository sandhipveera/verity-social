// BrandThemeProvider — fetches /api/brand/current + /api/domain/current
// on first paint, applies the palette + typography to <html> as CSS
// custom properties, and exposes both via React context.
//
// Per ADR-0046:
//   - No vertical-specific knowledge in this component
//   - Every visible string reachable from `useBrand().copy.<key>`
//   - Every color reachable as CSS var (var(--brand-primary)) OR as a
//     Tailwind utility (bg-brand-primary, text-brand-fg, etc.) thanks
//     to the @theme block in index.css
//   - Falls back to the platform default brand if the hostname doesn't
//     match a registered brand subdomain

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { BrandCurrent, DomainCurrent } from "../api/types";
import { fetchBrandCurrent, fetchDomainCurrent } from "../api/client";

interface BrandContextValue {
    brand: BrandCurrent | null;
    domain: DomainCurrent | null;
    loading: boolean;
    error: string | null;
}

const BrandContext = createContext<BrandContextValue>({
    brand: null,
    domain: null,
    loading: true,
    error: null,
});

/**
 * Apply a BrandCurrent payload to the document:
 *   - Set CSS custom properties on <html> from uiPalette + typography
 *   - Inject the brand's Google Fonts <link> if specified
 *   - Toggle the paper-grain overlay for editorial brands
 *   - Set <title> + favicon
 */
function applyBrandToDocument(brand: BrandCurrent): void {
    const root = document.documentElement;

    // CSS custom properties — palette
    const p = brand.uiPalette;
    root.style.setProperty("--brand-bg", p.background);
    root.style.setProperty("--brand-surface", p.surface);
    root.style.setProperty("--brand-surface2", p.surface2);
    root.style.setProperty("--brand-fg", p.foreground);
    root.style.setProperty("--brand-fg-soft", p.foregroundSoft);
    root.style.setProperty("--brand-muted", p.muted);
    root.style.setProperty("--brand-line", p.line);
    root.style.setProperty("--brand-primary", p.accentPrimary);
    root.style.setProperty("--brand-primary-deep", p.accentPrimaryDeep);
    root.style.setProperty("--brand-secondary", p.accentSecondary);
    root.style.setProperty("--brand-tertiary", p.accentTertiary);
    root.style.setProperty("--brand-signal-good", p.signalGood);
    root.style.setProperty("--brand-signal-alarm", p.signalAlarm);

    // CSS custom properties — typography
    const t = brand.typography;
    root.style.setProperty("--brand-font-display", t.displayFamily);
    root.style.setProperty("--brand-font-body", t.bodyFamily);
    root.style.setProperty("--brand-font-mono", t.monoFamily);

    // Google Fonts — idempotent: drop any prior brand-injected link
    // before adding the new one. Avoids stacking imports across SPA
    // navigations (we don't have any today, but prepare for it).
    const existing = document.querySelector<HTMLLinkElement>("link[data-brand-fonts]");
    if (existing) existing.remove();
    if (t.googleFontsHref) {
        const link = document.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("href", t.googleFontsHref);
        link.setAttribute("data-brand-fonts", "true");
        document.head.appendChild(link);
    }

    // Paper grain — opt-in via a brand metadata flag we'll add later;
    // for now, default to "on" for wellness, "off" for cyber.
    // Heuristic: bone-ish backgrounds get grain. Dark backgrounds do not.
    const isLight = isLightHex(p.background);
    root.setAttribute("data-brand-grain", isLight ? "on" : "off");
    root.setAttribute("data-brand-slug", brand.slug);

    // Document title + favicon
    document.title = brand.name;
    if (brand.logos.favicon) {
        let icon = document.querySelector<HTMLLinkElement>("link[rel='icon']");
        if (!icon) {
            icon = document.createElement("link");
            icon.setAttribute("rel", "icon");
            document.head.appendChild(icon);
        }
        icon.setAttribute("href", brand.logos.favicon);
    }
}

function isLightHex(hex: string): boolean {
    // Strip leading #, take the first 6 chars.
    const h = hex.replace("#", "").slice(0, 6);
    if (h.length < 6) return true;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    // Perceived luminance.
    return r * 0.299 + g * 0.587 + b * 0.114 > 160;
}

interface BrandThemeProviderProps {
    children: ReactNode;
}

export function BrandThemeProvider({ children }: BrandThemeProviderProps) {
    const [brand, setBrand] = useState<BrandCurrent | null>(null);
    const [domain, setDomain] = useState<DomainCurrent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [b, d] = await Promise.all([
                    fetchBrandCurrent(),
                    fetchDomainCurrent(),
                ]);
                if (cancelled) return;
                applyBrandToDocument(b);
                setBrand(b);
                setDomain(d);
                setLoading(false);
            } catch (err) {
                if (cancelled) return;
                console.error("[brand] failed to fetch /api/brand/current:", err);
                setError(err instanceof Error ? err.message : String(err));
                setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const value = useMemo<BrandContextValue>(
        () => ({ brand, domain, loading, error }),
        [brand, domain, loading, error]
    );

    return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand(): BrandContextValue {
    return useContext(BrandContext);
}
