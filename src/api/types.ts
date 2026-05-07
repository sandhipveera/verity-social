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

// Mirror of verity-core's shared/api-types EpisodeSummary. Only the
// fields the studio uses; verity-core's wire-shape may be wider.
export type EpisodeStatus =
    | "draft"
    | "research"
    | "scripting"
    | "shots_planning"
    | "rendering"
    | "ready_for_review"
    | "published"
    | "failed"
    | "regenerating";

export interface EpisodeSummary {
    id: string;
    title: string;
    slug: string;
    status: EpisodeStatus;
    durationSeconds: number | null;
    finalVideoUrl: string | null;
    thumbnailUrl: string | null;
    youtubeId: string | null;
    youtubeUrl: string | null;
    createdAt: string;
    publishedAt: string | null;
}

// ============================================================
// Audience-feedback closed loop (ADR-0047)
//
// Wire-types mirroring server/api/feedback.ts response shapes.
// Kept in sync manually — verity-social doesn't share TS imports
// across the repo boundary (per the agnostic contract from ADR-0046,
// the contract IS the wire shape).
// ============================================================

export type FeedbackThemeCategory =
    | "accepted"
    | "topic_request"
    | "criticism"
    | "controversy"
    | "style_note"
    | "off_topic"
    | "abuse";

export type FeedbackSentiment = "positive" | "neutral" | "negative";

export type FeedbackSourceChannel =
    | "youtube_comment"
    | "in_app_form"
    | "twitter_reply"
    | "reddit_comment"
    | "linkedin_reaction"
    | "tiktok_comment"
    | "rss_ping"
    | "manual";

export interface FeedbackRow {
    id: string;
    sourceChannel: FeedbackSourceChannel;
    authorLabel: string | null;
    rawText: string;
    receivedAt: string;
}

export interface FeedbackTheme {
    id: string;
    feedbackId: string;
    category: FeedbackThemeCategory;
    sentiment: FeedbackSentiment;
    themeLabel: string;
    themeDetail?: string | null;
    requestedTopic?: string | null;
    extractedAt: string;
}

export interface FeedbackListResponse {
    feedback: FeedbackRow[];
    themes: FeedbackTheme[];
}

export interface FeedbackAggregateResponse {
    feedbackCount: number;
    themeCount: number;
    byCategory: Array<{ category: FeedbackThemeCategory; count: number }>;
    topRequestedTopics: Array<{ topic: string; count: number }>;
}

export interface InheritFeedbackResponse {
    audienceLessons: string;
    inheritedThemeIds: string[];
    summary: string;
}

export interface SubmitFeedbackResponse {
    feedbackId: string;
    themesInserted: number;
}
