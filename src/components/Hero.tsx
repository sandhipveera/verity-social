// Brand-themed hero — copy comes from brand.copy.heroHeadline +
// brand.copy.heroSub. The headline supports inline emphasis tokens
// (see CopyEm) so the brand author chooses which words pop in
// brand-primary vs brand-secondary, without the studio component
// caring which vertical it's rendering.

import { motion } from "framer-motion";
import { useBrand } from "../theme/BrandThemeProvider";
import { CopyEm } from "./CopyEm";

export function Hero() {
    const { brand } = useBrand();
    if (!brand) return <section className="px-9 py-24" />;

    return (
        <section
            className="border-b border-brand-line"
            style={{ paddingBlock: "96px 80px" }}
        >
            <div className="mx-auto max-w-[1280px] px-9">
                <div className="grid gap-12 lg:grid-cols-[1fr_280px] items-end">
                    <motion.h1
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="leading-[0.92] tracking-[-0.04em]"
                        style={{
                            fontFamily: "var(--brand-font-display)",
                            fontWeight: 350,
                            fontSize: "clamp(64px, 11vw, 168px)",
                            color: "var(--brand-fg)",
                        }}
                    >
                        <CopyEm text={brand.copy.heroHeadline} />
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
                        className="text-[1.05rem] leading-[1.55] max-w-[420px] italic"
                        style={{
                            fontFamily: "var(--brand-font-display)",
                            fontWeight: 300,
                            color: "var(--brand-fg-soft)",
                        }}
                    >
                        {brand.copy.heroSub}
                    </motion.p>
                </div>
            </div>
        </section>
    );
}
