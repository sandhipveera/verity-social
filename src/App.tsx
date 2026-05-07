import { BrandThemeProvider, useBrand } from "./theme/BrandThemeProvider";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { BriefInput } from "./components/BriefInput";
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

function Shell() {
    return (
        <>
            <Header />
            <FetchError />
            <main>
                <Hero />
                <BriefInput />
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
