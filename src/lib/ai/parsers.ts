/**
 * Unified AI response parsers — gallery entries and blog posts.
 * Shared utilities for extracting structured fields from markdown.
 */

/** Tags/topics AI models use to mean "nothing" — filter these out. */
const IGNORE_TAGS = new Set([
  'none', 'null', 'n/a', 'na', 'undefined', 'nothing',
  'no tags', 'no new tags', 'no topics', 'no new topics', '-',
]);

function extractField(md: string, re: RegExp): string | null {
  const match = md.match(re);
  if (!match) return null;
  return match[1].replace(/\n+/g, ' ').trim();
}

function extractMultiline(md: string, re: RegExp): string | null {
  const match = md.match(re);
  return match ? match[1].trim() : null;
}

function cap(s: string | null, max: number): string | null {
  return s && s.length > max ? s.substring(0, max) : s;
}

function splitList(raw: string | null, maxLen: number, maxItems: number): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((t) => t.trim().toLowerCase().replace(/['"]/g, ''))
    .filter((t) => t && !IGNORE_TAGS.has(t))
    .map((t) => t.substring(0, maxLen))
    .slice(0, maxItems);
}

// ────────────────────────────────────────────────────
// Gallery entry parser
// ────────────────────────────────────────────────────

export interface ParsedAIResponse {
  title: string | null;
  prompt: string | null;
  description: string | null;
  tags: string[];
  newTags: string[];
}

const RE_TITLE = /\*\*Title:\*\*\s*(.+)/i;
const RE_TAGS = /\*\*Tags:\*\*\s*(.+)/i;
const RE_NEW_TAGS = /\*\*New tags:\*\*\s*(.+)/i;
const RE_PROMPT = /\*\*Prompt:\*\*\s*([\s\S]+?)(?=\n\*\*\w+:\*\*|$)/i;
const RE_DESC = /\*\*Description:\*\*\s*([\s\S]+?)(?=\n\*\*\w+:\*\*|$)/i;

/** Parse gallery AI markdown into structured fields. */
export function parseAIMarkdown(md: string): ParsedAIResponse {
  return {
    title: cap(extractField(md, RE_TITLE), 200),
    prompt: cap(extractMultiline(md, RE_PROMPT), 2000),
    description: cap(extractMultiline(md, RE_DESC), 2000),
    tags: splitList(extractField(md, RE_TAGS), 50, 20),
    newTags: splitList(extractField(md, RE_NEW_TAGS), 50, 20),
  };
}

// ────────────────────────────────────────────────────
// Blog post parser
// ────────────────────────────────────────────────────

export interface ParsedBlogAIResponse {
  title: string | null;
  summary: string | null;
  body: string | null;
  topics: string[];
  newTopics: string[];
}

const RE_BLOG_TITLE = /\*\*Title:\*\*\s*(.+)/i;
const RE_SUMMARY = /\*\*Summary:\*\*\s*(.+)/i;
const RE_TOPICS = /\*\*Topics:\*\*\s*(.+)/i;
const RE_NEW_TOPICS = /\*\*New topics:\*\*\s*(.+)/i;
const RE_BODY = /\*\*Body:\*\*\s*\n?([\s\S]*?)(?=\n\*\*Topics:\*\*|\n\*\*New topics:\*\*|$)/i;

/** Parse blog AI markdown into structured fields. */
export function parseBlogAIMarkdown(md: string): ParsedBlogAIResponse {
  const bodyMatch = md.match(RE_BODY);
  const body = bodyMatch ? bodyMatch[1].trim() : null;

  return {
    title: cap(extractField(md, RE_BLOG_TITLE), 200),
    summary: cap(extractField(md, RE_SUMMARY), 500),
    body: body && body.length > 50_000 ? body.substring(0, 50_000) : body,
    topics: splitList(extractField(md, RE_TOPICS), 50, 10),
    newTopics: splitList(extractField(md, RE_NEW_TOPICS), 50, 10),
  };
}
