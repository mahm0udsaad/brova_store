export type MarketingPlatform = "facebook" | "instagram" | "tiktok"

export interface MarketingPostCopy {
  caption: string
  hashtags: string[]
  cta: string
}

export interface MarketingPostMediaAssets {
  images: string[]
  video?: {
    posterUrl: string | null
    videoUrl: string | null
  } | null
}

export interface MarketingPostUI {
  platform: MarketingPlatform
  header: {
    name: string
    handle: string
    avatarUrl: string
    timestamp: string
  }
  media: {
    type: "image" | "video"
    urls: string[]
    aspectRatio: "1:1" | "4:3" | "9:16"
  }
  actions: {
    like: boolean
    comment: boolean
    share: boolean
    save: boolean
    viewCount: boolean
  }
  metrics: {
    likes: number
    comments: number
    shares: number
    saves: number
    views: number
  }
  caption: string
  hashtags: string[]
  cta: string
}

interface BuildDraftOptions {
  platform: MarketingPlatform
  post: Partial<MarketingPostCopy> & { caption?: string }
  mediaUrls: string[]
  brand?: {
    name?: string
    handle?: string
    avatarUrl?: string
  }
}

const DEFAULT_BRAND = {
  name: "Brova",
  handle: "brova",
  avatarUrl: "/placeholder-logo.svg",
}

const DEFAULT_CAPTION = "New drop is live now. Tap to explore the full collection."

function hashSeed(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0
  }
  return hash
}

function metricFrom(seed: number, min: number, max: number) {
  const range = max - min + 1
  return min + (seed % range)
}

function buildMetrics(seedText: string) {
  const seed = hashSeed(seedText)
  return {
    likes: metricFrom(seed, 420, 6200),
    comments: metricFrom(seed >> 2, 14, 520),
    shares: metricFrom(seed >> 3, 6, 320),
    saves: metricFrom(seed >> 4, 20, 980),
    views: metricFrom(seed >> 1, 1800, 48000),
  }
}

function normalizeHashtags(hashtags: unknown) {
  if (!hashtags) return []
  if (Array.isArray(hashtags)) return hashtags.filter(Boolean).map(String)
  if (typeof hashtags === "string") {
    return hashtags
      .split(/\s+/)
      .map((tag) => tag.replace(/^#/, ""))
      .filter(Boolean)
  }
  return []
}

export function buildMarketingDraft({ platform, post, mediaUrls, brand }: BuildDraftOptions) {
  const brandData = { ...DEFAULT_BRAND, ...brand }
  const caption = post.caption?.trim() || DEFAULT_CAPTION
  const hashtags = normalizeHashtags(post.hashtags)
  const cta = post.cta?.trim() || "Shop now"
  const metrics = buildMetrics(`${platform}-${caption}-${hashtags.join(",")}`)
  const urls = mediaUrls.length > 0 ? mediaUrls : [DEFAULT_BRAND.avatarUrl]

  const uiStructure: MarketingPostUI = {
    platform,
    header: {
      name: brandData.name,
      handle: brandData.handle,
      avatarUrl: brandData.avatarUrl,
      timestamp: "Just now",
    },
    media: {
      type: platform === "tiktok" ? "video" : "image",
      urls,
      aspectRatio: platform === "instagram" ? "1:1" : platform === "facebook" ? "4:3" : "9:16",
    },
    actions: {
      like: true,
      comment: true,
      share: true,
      save: platform === "instagram",
      viewCount: platform === "tiktok",
    },
    metrics,
    caption,
    hashtags,
    cta,
  }

  const mediaAssets: MarketingPostMediaAssets = {
    images: urls,
    video: platform === "tiktok" ? { posterUrl: urls[0] ?? null, videoUrl: null } : null,
  }

  const copyText: MarketingPostCopy = {
    caption,
    hashtags,
    cta,
  }

  return {
    platform,
    uiStructure,
    mediaAssets,
    copyText,
    status: "draft",
    version: 1,
  }
}

export function buildMarketingDrafts(
  posts: Record<string, any>,
  mediaUrls: string[],
  brand?: BuildDraftOptions["brand"]
) {
  return Object.entries(posts)
    .filter(([platform]) => platform === "facebook" || platform === "instagram" || platform === "tiktok")
    .map(([platform, post]) =>
      buildMarketingDraft({
        platform: platform as MarketingPlatform,
        post,
        mediaUrls,
        brand,
      })
    )
}
