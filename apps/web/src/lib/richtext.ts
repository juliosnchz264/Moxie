interface RichTextMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface RichTextNode {
  type: string;
  content?: RichTextNode[];
  text?: string;
  marks?: RichTextMark[];
  attrs?: Record<string, unknown>;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeHref(raw: unknown): string {
  if (typeof raw !== 'string') return '#';
  if (/^(https?:|mailto:|\/|#)/i.test(raw)) return raw;
  return '#';
}

function renderMarks(inner: string, marks: RichTextMark[] = []): string {
  let out = inner;
  for (const m of marks) {
    switch (m.type) {
      case 'bold':
        out = `<strong>${out}</strong>`;
        break;
      case 'italic':
        out = `<em>${out}</em>`;
        break;
      case 'strike':
        out = `<s>${out}</s>`;
        break;
      case 'code':
        out = `<code class="bg-slate-100 rounded px-1">${out}</code>`;
        break;
      case 'link': {
        const href = safeHref(m.attrs?.href);
        out = `<a href="${esc(href)}" rel="noopener noreferrer" class="underline">${out}</a>`;
        break;
      }
    }
  }
  return out;
}

export function renderRichText(node: unknown): string {
  if (!node || typeof node !== 'object') return '';
  const n = node as RichTextNode;
  const kids = (n.content ?? []).map(renderRichText).join('');
  switch (n.type) {
    case 'doc':
      return kids;
    case 'paragraph':
      return `<p>${kids}</p>`;
    case 'heading': {
      const raw = Number(n.attrs?.level) || 1;
      const level = Math.min(Math.max(raw, 1), 3);
      const cls = level === 1 ? 'text-2xl font-bold' : level === 2 ? 'text-xl font-semibold' : 'text-lg font-semibold';
      return `<h${level} class="${cls}">${kids}</h${level}>`;
    }
    case 'bulletList':
      return `<ul class="list-disc pl-5">${kids}</ul>`;
    case 'orderedList':
      return `<ol class="list-decimal pl-5">${kids}</ol>`;
    case 'listItem':
      return `<li>${kids}</li>`;
    case 'blockquote':
      return `<blockquote class="border-l-4 border-slate-300 pl-3 italic">${kids}</blockquote>`;
    case 'codeBlock':
      return `<pre class="bg-slate-100 rounded p-2 text-sm"><code>${kids}</code></pre>`;
    case 'horizontalRule':
      return `<hr class="my-4 border-slate-200" />`;
    case 'hardBreak':
      return `<br />`;
    case 'text':
      return renderMarks(esc(String(n.text ?? '')), n.marks ?? []);
    default:
      return kids;
  }
}
