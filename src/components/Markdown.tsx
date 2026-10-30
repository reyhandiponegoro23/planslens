import { Fragment } from "react";

// Renders the small Markdown subset the AI uses (paragraphs, headings, numbered and bullet
// lists, **bold**, *italic*) as React elements, so no HTML from the model is ever injected.

function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|_[^_\s][^_]*_)/g).map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (/^(\*[^*].*\*|_[^_].*_)$/.test(part)) return <em key={i}>{part.slice(1, -1)}</em>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

type Block =
  | { kind: "p"; lines: string[] }
  | { kind: "h"; text: string }
  | { kind: "ol" | "ul"; items: string[][] };

function parse(source: string): Block[] {
  type List = Extract<Block, { kind: "ol" | "ul" }>;
  const blocks: Block[] = [];
  // Open list or paragraph; headings are pushed straight away.
  const state: { current: List | Extract<Block, { kind: "p" }> | null; gap: boolean } = { current: null, gap: false };
  const flush = () => {
    if (state.current) blocks.push(state.current);
    state.current = null;
  };

  for (const raw of source.replace(/\r/g, "").split("\n")) {
    const line = raw.trimEnd();
    const indented = /^\s+/.test(raw);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const h = line.match(/^#{1,6}\s+(.*)$/);
    // Blank lines end a paragraph, but a list survives them ("1. a\n\n2. b" is one list).
    if (!line.trim()) {
      if (state.current?.kind === "p") flush();
      else state.gap = true;
      continue;
    }
    if (state.gap && !ol && !ul && !indented) flush();
    state.gap = false;
    const cur = state.current;
    if (h) { flush(); blocks.push({ kind: "h", text: h[1] }); continue; }
    if (ol || ul) {
      const kind = ol ? "ol" : "ul";
      const text = (ol ?? ul)![1];
      // A bullet indented under a numbered item becomes part of that item.
      if (cur?.kind === "ol" && ul && indented) { cur.items.at(-1)!.push(text); continue; }
      if (cur?.kind === kind) { cur.items.push([text]); continue; }
      flush();
      state.current = { kind, items: [[text]] };
      continue;
    }
    if (cur && cur.kind !== "p" && indented) { cur.items.at(-1)!.push(line.trim()); continue; }
    if (cur?.kind === "p") { cur.lines.push(line); continue; }
    flush();
    state.current = { kind: "p", lines: [line] };
  }
  flush();
  return blocks;
}

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="md">
      {parse(text).map((b, i) => {
        if (b.kind === "h") return <h3 key={i}>{inline(b.text)}</h3>;
        if (b.kind === "p")
          return <p key={i}>{b.lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>;
        const List = b.kind;
        return (
          <List key={i}>
            {b.items.map((lines, j) => (
              <li key={j}>{lines.map((l, k) => <Fragment key={k}>{k > 0 && <br />}{inline(l)}</Fragment>)}</li>
            ))}
          </List>
        );
      })}
    </div>
  );
}
