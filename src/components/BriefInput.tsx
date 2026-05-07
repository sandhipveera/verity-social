// BriefInput — the front door for new episodes. Copy is brand-driven;
// the component itself is vertical-agnostic.

import { useState } from "react";
import { motion } from "framer-motion";
import { useBrand } from "../theme/BrandThemeProvider";

export function BriefInput() {
    const { brand } = useBrand();
    const [text, setText] = useState("");
    if (!brand) return null;

    return (
        <section className="border-b border-brand-line">
            <div className="mx-auto max-w-[1280px] px-9 py-14">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="grid gap-6 md:grid-cols-[1fr_auto] items-end"
                >
                    <label className="block">
                        <span
                            className="block mb-2 text-[0.65rem] uppercase tracking-[0.18em] text-brand-muted"
                            style={{ fontFamily: "var(--brand-font-mono)" }}
                        >
                            New episode
                        </span>
                        <textarea
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={brand.copy.briefInputPlaceholder}
                            rows={2}
                            className="w-full resize-y border border-brand-line bg-brand-surface px-5 py-4 text-base placeholder:text-brand-muted placeholder:italic"
                            style={{
                                fontFamily: "var(--brand-font-body)",
                                color: "var(--brand-fg)",
                            }}
                        />
                    </label>
                    <button
                        type="button"
                        disabled={text.trim().length === 0}
                        onClick={() => {
                            // TODO: POST /api/episodes — wired in next iteration
                            console.log("[brief] submit:", text);
                        }}
                        className="px-7 py-4 uppercase tracking-[0.18em] text-[0.78rem] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:translate-y-[-1px]"
                        style={{
                            fontFamily: "var(--brand-font-mono)",
                            background: "var(--brand-primary)",
                            color: "var(--brand-bg)",
                        }}
                    >
                        {brand.copy.briefInputCta} →
                    </button>
                </motion.div>
            </div>
        </section>
    );
}
