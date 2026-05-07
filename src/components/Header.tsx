// Brand-themed header — every visible string + color comes from the
// brand-config response.

import { useBrand } from "../theme/BrandThemeProvider";

export function Header() {
    const { brand } = useBrand();

    // Pre-mount: render minimal skeleton with brand-bg defaults so the
    // initial paint isn't a flash of blank white before the fetch.
    if (!brand) {
        return (
            <header className="border-b border-brand-line">
                <div className="mx-auto max-w-[1280px] px-9 py-5 h-14" />
            </header>
        );
    }

    // Split the brand name on slash if it's a `verity / Wellness` shape;
    // otherwise render the whole name as the wordmark.
    const [primary, secondary] = brand.name.includes("/")
        ? brand.name.split("/").map((s) => s.trim())
        : [brand.name, null];

    return (
        <header className="sticky top-0 z-50 border-b border-brand-line bg-brand-bg backdrop-blur-sm">
            <div className="mx-auto max-w-[1280px] px-9 py-5 flex items-center justify-between gap-6">
                <div className="flex items-baseline gap-2.5">
                    <span
                        className="text-[1.55rem] leading-none italic font-medium"
                        style={{ fontFamily: "var(--brand-font-display)" }}
                    >
                        {primary.toLowerCase().split(" ")[0]}
                    </span>
                    {secondary && (
                        <>
                            <span className="text-base text-brand-muted font-light">/</span>
                            <span
                                className="px-2 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.18em] border border-brand-primary text-brand-primary"
                                style={{ fontFamily: "var(--brand-font-mono)" }}
                            >
                                {secondary}
                            </span>
                        </>
                    )}
                </div>
                <nav
                    className="hidden md:flex gap-7"
                    style={{ fontFamily: "var(--brand-font-mono)" }}
                >
                    <NavLink active>Studio</NavLink>
                    <NavLink>Insights</NavLink>
                    <NavLink>Channels</NavLink>
                    <NavLink>Library</NavLink>
                </nav>
                <span
                    className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[0.62rem] font-semibold tracking-[0.12em] uppercase"
                    style={{
                        fontFamily: "var(--brand-font-mono)",
                        background: "var(--brand-primary)",
                        color: "var(--brand-bg)",
                    }}
                >
                    <Pulse />
                    Live
                </span>
            </div>
        </header>
    );
}

function NavLink({ children, active }: { children: React.ReactNode; active?: boolean }) {
    return (
        <a
            href="#"
            className="py-1.5 text-[0.72rem] font-semibold uppercase tracking-[0.14em] border-b-2 transition-colors"
            style={{
                color: "var(--brand-fg)",
                borderBottomColor: active ? "var(--brand-primary)" : "transparent",
            }}
        >
            {children}
        </a>
    );
}

function Pulse() {
    return (
        <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{
                background: "var(--brand-bg)",
                animation: "verity-pulse 1.4s ease-in-out infinite",
            }}
        >
            <style>{`@keyframes verity-pulse { 50% { opacity: 0.3; } }`}</style>
        </span>
    );
}
