// Wire-types mirroring verity-core's BrandPublic / DomainPublic
// projections (shared/api-types.ts on the server). Duplicated
// deliberately so verity-social stays free of cross-repo TS imports.

export interface BrandUiPalette {
    background: string;
    surface: string;
    surface2: string;
    foreground: string;
    foregroundSoft: string;
    muted: string;
    line: string;
    accentPrimary: string;
    accentPrimaryDeep: string;
    accentSecondary: string;
    accentTertiary: string;
    signalGood: string;
    signalAlarm: string;
}

export interface BrandTypography {
    displayFamily: string;
    bodyFamily: string;
    monoFamily: string;
    googleFontsHref?: string;
}

export interface BrandLogos {
    light?: string;
    dark?: string;
    favicon?: string;
}

export interface BrandCopy {
    heroHeadline: string;
    heroSub: string;
    briefInputPlaceholder: string;
    briefInputCta: string;
    channelLabelFormat: string;
    insightsTitle: string;
    feedbackPrompt: string;
    feedbackPlaceholder: string;
    feedbackSubmit: string;
    regenerateCta: string;
    regenerateTitle: string;
    regenerateSub: string;
    emptyEpisodes: string;
    loading: string;
    errorFallback: string;
}

export interface BrandCurrent {
    slug: string;
    name: string;
    tagline: string;
    url: string;
    subdomain: string;
    youtubeChannelHandle?: string;
    uiPalette: BrandUiPalette;
    typography: BrandTypography;
    logos: BrandLogos;
    copy: BrandCopy;
    domainSlug: string;
    matched: boolean;
}

export interface DomainCurrent {
    slug: string;
    name: string;
    contentTypes: string[];
    complianceLensLabel?: string;
    complianceFrameworks: string[];
    uiExtensions: string[];
}
