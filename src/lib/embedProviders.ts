/**
 * Embed provider registry. Given a URL, returns an embed descriptor that the
 * in-app viewer can render directly inside an iframe using the platform's
 * OFFICIAL embed endpoint (no scraping, no raw page iframing). Unsupported
 * URLs return `null` so the caller falls back to a rich metadata card.
 */

export type EmbedKind = "video" | "audio" | "social" | "image";

export interface EmbedDescriptor {
  provider:
    | "youtube"
    | "vimeo"
    | "spotify"
    | "twitch"
    | "instagram"
    | "tiktok"
    | "twitter";
  kind: EmbedKind;
  /** Iframe src to load. */
  src: string;
  /** Suggested aspect ratio (w / h). */
  aspect: number;
  /** Allow attribute for iframe. */
  allow?: string;
  /** Whether browser fullscreen should be available. */
  allowFullScreen?: boolean;
  /** Optional title for a11y. */
  title: string;
}

const safeUrl = (raw: string): URL | null => {
  try {
    return new URL(raw);
  } catch {
    return null;
  }
};

const hostOf = (u: URL): string => u.hostname.replace(/^www\./, "").toLowerCase();

const parentHost = (): string => {
  if (typeof window === "undefined") return "needforscore.com";
  return window.location.hostname || "needforscore.com";
};

const youtubeId = (u: URL): string | null => {
  const host = hostOf(u);
  if (host === "youtu.be") return u.pathname.split("/").filter(Boolean)[0] ?? null;
  if (host.endsWith("youtube.com")) {
    if (u.pathname === "/watch") return u.searchParams.get("v");
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") {
      return parts[1] ?? null;
    }
  }
  return null;
};

const vimeoId = (u: URL): string | null => {
  if (hostOf(u) !== "vimeo.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const id = parts.find((p) => /^\d+$/.test(p));
  return id ?? null;
};

const spotifyEmbed = (u: URL): { src: string; aspect: number } | null => {
  if (hostOf(u) !== "open.spotify.com") return null;
  const parts = u.pathname.split("/").filter(Boolean);
  // /track/ID, /episode/ID, /playlist/ID, /album/ID, /show/ID
  const type = parts[0];
  const id = parts[1]?.split("?")[0];
  if (!type || !id) return null;
  if (!["track", "episode", "playlist", "album", "show", "artist"].includes(type)) return null;
  const aspect = type === "track" || type === "episode" ? 16 / 9 : 1; // episodes/tracks compact, others taller
  return { src: `https://open.spotify.com/embed/${type}/${id}?utm_source=needforscore`, aspect };
};

const twitchEmbed = (u: URL): { src: string; aspect: number } | null => {
  const host = hostOf(u);
  if (host !== "twitch.tv" && !host.endsWith(".twitch.tv")) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  const parent = parentHost();
  // /videos/ID
  if (parts[0] === "videos" && parts[1]) {
    return { src: `https://player.twitch.tv/?video=${parts[1]}&parent=${parent}&autoplay=false`, aspect: 16 / 9 };
  }
  // /<channel>/clip/SLUG
  if (parts[1] === "clip" && parts[2]) {
    return { src: `https://clips.twitch.tv/embed?clip=${parts[2]}&parent=${parent}&autoplay=false`, aspect: 16 / 9 };
  }
  // clips.twitch.tv/SLUG
  if (host === "clips.twitch.tv" && parts[0]) {
    return { src: `https://clips.twitch.tv/embed?clip=${parts[0]}&parent=${parent}&autoplay=false`, aspect: 16 / 9 };
  }
  // /<channel> → live channel
  if (parts.length === 1 && parts[0] && parts[0] !== "directory") {
    return { src: `https://player.twitch.tv/?channel=${parts[0]}&parent=${parent}&autoplay=false`, aspect: 16 / 9 };
  }
  return null;
};

const instagramEmbed = (u: URL): { src: string; aspect: number } | null => {
  const host = hostOf(u);
  if (host !== "instagram.com" && !host.endsWith(".instagram.com")) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  // /p/ID, /reel/ID, /tv/ID
  const i = parts.findIndex((p) => ["p", "reel", "reels", "tv"].includes(p));
  if (i === -1 || !parts[i + 1]) return null;
  const id = parts[i + 1];
  return { src: `https://www.instagram.com/p/${id}/embed/captioned/`, aspect: 9 / 16 };
};

const tiktokEmbed = (u: URL): { src: string; aspect: number } | null => {
  const host = hostOf(u);
  if (host !== "tiktok.com" && !host.endsWith(".tiktok.com")) return null;
  const parts = u.pathname.split("/").filter(Boolean);
  // /@user/video/ID
  const vi = parts.indexOf("video");
  if (vi !== -1 && parts[vi + 1]) {
    return { src: `https://www.tiktok.com/embed/v2/${parts[vi + 1]}`, aspect: 9 / 16 };
  }
  return null;
};

const twitterEmbed = (u: URL): { src: string; aspect: number } | null => {
  const host = hostOf(u);
  if (!["x.com", "twitter.com"].includes(host) && !host.endsWith(".x.com") && !host.endsWith(".twitter.com")) {
    return null;
  }
  const parts = u.pathname.split("/").filter(Boolean);
  const si = parts.indexOf("status");
  const id = si !== -1 ? parts[si + 1] : parts.length === 3 && parts[1] === "status" ? parts[2] : null;
  if (!id) return null;
  return {
    src: `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark&dnt=true`,
    aspect: 1,
  };
};

export const detectEmbed = (raw: string): EmbedDescriptor | null => {
  const u = safeUrl(raw);
  if (!u) return null;

  const yt = youtubeId(u);
  if (yt) {
    return {
      provider: "youtube",
      kind: "video",
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&playsinline=1`,
      aspect: 16 / 9,
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share",
      allowFullScreen: true,
      title: "YouTube",
    };
  }

  const vm = vimeoId(u);
  if (vm) {
    return {
      provider: "vimeo",
      kind: "video",
      src: `https://player.vimeo.com/video/${vm}?dnt=1`,
      aspect: 16 / 9,
      allow: "autoplay; fullscreen; picture-in-picture; clipboard-write",
      allowFullScreen: true,
      title: "Vimeo",
    };
  }

  const sp = spotifyEmbed(u);
  if (sp) {
    return {
      provider: "spotify",
      kind: "audio",
      src: sp.src,
      aspect: sp.aspect,
      allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture",
      title: "Spotify",
    };
  }

  const tw = twitchEmbed(u);
  if (tw) {
    return {
      provider: "twitch",
      kind: "video",
      src: tw.src,
      aspect: tw.aspect,
      allow: "autoplay; fullscreen",
      allowFullScreen: true,
      title: "Twitch",
    };
  }

  const ig = instagramEmbed(u);
  if (ig) {
    return {
      provider: "instagram",
      kind: "social",
      src: ig.src,
      aspect: ig.aspect,
      title: "Instagram",
    };
  }

  const tk = tiktokEmbed(u);
  if (tk) {
    return {
      provider: "tiktok",
      kind: "social",
      src: tk.src,
      aspect: tk.aspect,
      allow: "autoplay; clipboard-write; encrypted-media; picture-in-picture",
      allowFullScreen: true,
      title: "TikTok",
    };
  }

  const tt = twitterEmbed(u);
  if (tt) {
    return {
      provider: "twitter",
      kind: "social",
      src: tt.src,
      aspect: tt.aspect,
      title: "X",
    };
  }

  return null;
};

export const providerLabel = (p: EmbedDescriptor["provider"]): string => {
  switch (p) {
    case "youtube": return "YouTube";
    case "vimeo": return "Vimeo";
    case "spotify": return "Spotify";
    case "twitch": return "Twitch";
    case "instagram": return "Instagram";
    case "tiktok": return "TikTok";
    case "twitter": return "X";
  }
};
