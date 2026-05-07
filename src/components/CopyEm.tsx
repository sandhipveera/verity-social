// Tiny renderer for brand copy strings that may contain inline emphasis
// markers — `[em-primary]…[/em-primary]` and `[em-secondary]…[/em-secondary]`.
//
// Brand copy lives in the BrandConfig.copy bundle on verity-core. The
// emphasis tokens let the brand author decide which words pop in the
// brand's primary or secondary accent without exposing any vertical
// vocabulary in the studio's component code.
//
// Example:
//   "Wellness, with the [em-secondary]receipts[/em-secondary]."
// renders the word "receipts" inside an italic <em> styled with the
// brand secondary color (oxblood for wellness, cyan for cyber).
//
// Unknown markers fall through unchanged — nothing crashes if a brand
// uses tokens we don't render yet.

import { type ReactElement, type ReactNode } from "react";

type Emphasis = "em-primary" | "em-secondary";

interface Token {
    text: string;
    em?: Emphasis;
}

const EM_PATTERN = /\[(em-primary|em-secondary)\]([\s\S]*?)\[\/\1\]/g;

function tokenize(copy: string): Token[] {
    const out: Token[] = [];
    let lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = EM_PATTERN.exec(copy)) !== null) {
        if (m.index > lastIndex) {
            out.push({ text: copy.slice(lastIndex, m.index) });
        }
        out.push({ text: m[2], em: m[1] as Emphasis });
        lastIndex = m.index + m[0].length;
    }
    if (lastIndex < copy.length) {
        out.push({ text: copy.slice(lastIndex) });
    }
    return out;
}

interface Props {
    text: string;
    className?: string;
}

export function CopyEm({ text, className }: Props): ReactElement {
    const tokens = tokenize(text);
    return (
        <span className={className}>
            {tokens.map((tok, i): ReactNode => {
                if (tok.em === "em-primary") {
                    return (
                        <em
                            key={i}
                            className="not-italic"
                            style={{ fontStyle: "italic", color: "var(--brand-primary)" }}
                        >
                            {tok.text}
                        </em>
                    );
                }
                if (tok.em === "em-secondary") {
                    return (
                        <em
                            key={i}
                            style={{ fontStyle: "italic", color: "var(--brand-secondary)" }}
                        >
                            {tok.text}
                        </em>
                    );
                }
                return <span key={i}>{tok.text}</span>;
            })}
        </span>
    );
}
