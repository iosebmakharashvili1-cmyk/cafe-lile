// Lightweight marketing attribution: on load we grab utm_* params (and referrer)
// from the URL, remember them across pages/reloads in sessionStorage, and expose
// a compact string that gets appended to the order's customer note so the cafe
// can see where orders came from without any backend changes.

const STORAGE_KEY = "cl_utm";
const MAX_NOTE_LEN = 280;

export interface Attribution {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string;
  capturedAt: string;
}

/** Reads utm_* params + referrer from the current URL into storage. Call once on app mount. */
export function captureAttribution(): void {
  const params = new URLSearchParams(window.location.search);
  const attr: Partial<Attribution> = {};

  const source = params.get("utm_source");
  if (source) attr.source = source.slice(0, 60);
  const medium = params.get("utm_medium");
  if (medium) attr.medium = medium.slice(0, 60);
  const campaign = params.get("utm_campaign");
  if (campaign) attr.campaign = campaign.slice(0, 60);
  const content = params.get("utm_content");
  if (content) attr.content = content.slice(0, 60);
  const term = params.get("utm_term");
  if (term) attr.term = term.slice(0, 60);

  let referrer: string | undefined;
  try {
    referrer =
      document.referrer && !document.referrer.startsWith(window.location.origin)
        ? new URL(document.referrer).hostname.slice(0, 60)
        : undefined;
  } catch {
    referrer = undefined; // malformed referrer — ignore
  }
  if (referrer) attr.referrer = referrer;

  if (Object.keys(attr).length === 0) return; // nothing to record on a plain visit

  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...attr, capturedAt: new Date().toISOString() } satisfies Attribution)
    );
  } catch {
    // Storage unavailable — attribution is best-effort only.
  }
}

/**
 * Compact attribution suffix for the order note, e.g. "[src=instagram cmp=summer-launch]".
 * Returns null when there is nothing recorded or no room left in the note.
 */
export function attributionNoteSuffix(currentNoteLength = 0): string | null {
  let attr: Attribution | null = null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) attr = JSON.parse(raw) as Attribution;
  } catch {
    return null;
  }
  if (!attr) return null;

  const parts: string[] = [];
  if (attr.source) parts.push(`src=${attr.source}`);
  if (attr.medium) parts.push(`med=${attr.medium}`);
  if (attr.campaign) parts.push(`cmp=${attr.campaign}`);
  if (attr.content) parts.push(`ct=${attr.content}`);
  if (attr.term) parts.push(`kw=${attr.term}`);
  if (attr.referrer) parts.push(`ref=${attr.referrer}`);
  if (parts.length === 0) return null;

  const suffix = `[${parts.join(" ")}]`;
  if (currentNoteLength + suffix.length + 1 > MAX_NOTE_LEN) return null;
  return suffix;
}
