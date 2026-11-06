import type { Graph } from "./graph";
import type { Post } from "./queue";
import type { State } from "./state";

/**
 * BL-118 — the daily comment digest: new comments on our own posts, each with a drafted reply for the PO to adapt and post
 * in the Instagram app themselves. Nothing is ever replied automatically. The commenter's name is not fetched or mailed: the
 * permalink leads the PO to the comment.
 */
export type NewComment = { id: string; text: string; timestamp?: string; suggestion: string };
export type DigestItem = { postId: string; title?: string; permalink?: string; comments: NewComment[] };

const GERMAN = /[äöüß]|\b(und|der|die|das|ich|ist|nicht|welche[srnm]?|wie|mein[e]?|hat|gibt|passt|danke|schön|geil)\b/i;
const QUESTION = /\?|^(wie|was|welche|wo|wann|warum|passt|gibt|kann|how|what|which|where|when|why|does|do|can|is)\b/i;

/** A first draft only: thanks, or an answer to fill in for a question, in the comment's language. The PO always edits it. */
export function draftReply(text: string): string {
  const de = GERMAN.test(text);
  if (QUESTION.test(text.trim())) {
    return de
      ? "Danke für die Frage! [Antwort ergänzen] Für dein genaues Auto zeigt es dir E46BUILD: Link in der Bio."
      : "Thanks for asking! [add the answer] For your exact car, E46BUILD shows it: link in bio.";
  }
  return de ? "Danke dir! Schön, dass es dir gefällt." : "Thank you! Glad you like it.";
}

export async function collectNewComments(published: { post: Post; mediaId: string; permalink?: string }[], graph: Graph, state: State): Promise<DigestItem[]> {
  const items: DigestItem[] = [];
  for (const { post, mediaId, permalink } of published) {
    const { data = [] } = await graph.comments(mediaId);
    const fresh: NewComment[] = [];
    for (const c of data) {
      if (!c.text || !(await state.firstSeen(c.id))) continue;
      fresh.push({ id: c.id, text: c.text, timestamp: c.timestamp, suggestion: draftReply(c.text) });
    }
    if (fresh.length) items.push({ postId: post.id, title: post.title, permalink, comments: fresh });
  }
  return items;
}

/** The e-mail to the PO (plain text, German like the other internal mails). */
export function digestMail(items: DigestItem[]): { subject: string; text: string } {
  const n = items.reduce((s, i) => s + i.comments.length, 0);
  const lines = [
    `${n} neue${n === 1 ? "r" : ""} Kommentar${n === 1 ? "" : "e"} auf Instagram (@zauberlabs).`,
    "Antworten bitte selbst in der Instagram-App; die Vorschläge sind nur Entwürfe. Es wird nichts automatisch beantwortet.",
    "",
  ];
  for (const item of items) {
    lines.push(`■ ${item.title ?? item.postId}${item.permalink ? `\n  ${item.permalink}` : ""}`);
    for (const c of item.comments) {
      lines.push(`  „${c.text}“${c.timestamp ? ` (${c.timestamp.slice(0, 16).replace("T", " ")} UTC)` : ""}`, `  Vorschlag: ${c.suggestion}`, "");
    }
  }
  return { subject: `Instagram: ${n} neue${n === 1 ? "r" : ""} Kommentar${n === 1 ? "" : "e"}`, text: lines.join("\n") };
}
