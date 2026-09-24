// Markdown -> DOCX converter using docx-js (schema-valid OOXML, unlike the
// pandoc output this replaces, which failed XSD validation).
// Usage: node convert.js <input.md> <output.docx> ["Title"]
const fs = require("fs");
const path = require("path");
const { marked } = require("marked");
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow,
  TableCell, WidthType, BorderStyle, AlignmentType, ShadingType,
  LevelFormat, ExternalHyperlink, PageOrientation,
} = require("docx");

const [, , inFile, outFile, titleArg] = process.argv;
if (!inFile || !outFile) {
  console.error("Usage: node convert.js <input.md> <output.docx> [title]");
  process.exit(1);
}
const src = fs.readFileSync(inFile, "utf8");

// ---------- palette (AgrosTech brand, from data-room/index.html) ----------
const INK = "1C2A20";
const GOLD = "E5A72C";
const MUTED = "5A6A5E";
const LINE = "D9D3C3";

const FONT = "Calibri";
const MONO = "Consolas";

const PAGE = { width: 12240, height: 15840 }; // US Letter, DXA
const MARGIN = 1080; // 0.75in
const CONTENT_DXA = PAGE.width - MARGIN * 2;

const numbering = {
  config: [
    { reference: "bullets", levels: [
      { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
      { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 920, hanging: 260 } } } },
    ]},
    { reference: "numbers", levels: [
      { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 460, hanging: 260 } } } },
    ]},
  ],
};

// ---------- inline token -> TextRun[] / ExternalHyperlink[] ----------
// docx's TextRun doesn't expose its original construction options back off
// the instance, so composing nested marks (e.g. bold-inside-italic) needs a
// side map of options recorded at creation time.
function linkText(t) {
  return (t.tokens || []).map((x) => x.text || "").join("") || t.href;
}
const RUN_OPTS = new WeakMap();
function mkRun(opts) {
  const r = new TextRun(opts);
  RUN_OPTS.set(r, opts);
  return r;
}
function extraFromRun(run) {
  return RUN_OPTS.get(run) || {};
}

function inline(tokens) {
  const runs = [];
  for (const t of tokens || []) {
    switch (t.type) {
      case "text":
      case "escape":
        runs.push(mkRun({ text: t.text, font: FONT }));
        break;
      case "strong":
        for (const r of inline(t.tokens)) {
          const o = Object.assign({}, extraFromRun(r), { bold: true });
          runs.push(mkRun(o));
        }
        break;
      case "em":
        for (const r of inline(t.tokens)) {
          const o = Object.assign({}, extraFromRun(r), { italics: true });
          runs.push(mkRun(o));
        }
        break;
      case "codespan":
        runs.push(mkRun({ text: t.text, font: MONO, size: 20,
          shading: { type: ShadingType.CLEAR, fill: "F2EFE6" } }));
        break;
      case "link":
        runs.push(new ExternalHyperlink({
          link: t.href,
          children: [mkRun({ text: linkText(t), font: FONT, color: "2563EB", underline: {} })],
        }));
        break;
      case "br":
        runs.push(mkRun({ text: "", break: 1 }));
        break;
      default:
        if (t.tokens) runs.push(...inline(t.tokens));
        else if (t.text) runs.push(mkRun({ text: t.text, font: FONT }));
    }
  }
  return runs;
}

// ---------- block token -> Paragraph[] / Table[] ----------
function headingLevel(depth) {
  return [null, HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3,
    HeadingLevel.HEADING_4, HeadingLevel.HEADING_4, HeadingLevel.HEADING_4][depth];
}

function paragraphFromTokens(tokens, opts) {
  return new Paragraph(Object.assign({ children: inline(tokens) }, opts || {}));
}

function listParagraphs(listToken, refName, depth) {
  const out = [];
  let idx = 0;
  for (const item of listToken.items) {
    idx += 1;
    const itemTokens = item.tokens.filter((t) => t.type === "text" || t.type === "paragraph");
    let inlineTokens = [];
    for (const it of itemTokens) inlineTokens = inlineTokens.concat(it.tokens || []);
    out.push(new Paragraph({
      children: inline(inlineTokens),
      numbering: { reference: refName, level: depth },
      spacing: { after: 40 },
    }));
    const nested = item.tokens.find((t) => t.type === "list");
    if (nested) out.push(...listParagraphs(nested, nested.ordered ? "numbers" : "bullets", depth + 1));
  }
  return out;
}

function tableFromToken(tok) {
  const nCols = tok.header.length;
  const colWidth = Math.floor(CONTENT_DXA / nCols);
  const colWidths = new Array(nCols).fill(colWidth);

  function cell(cellTokens, isHeader) {
    return new TableCell({
      width: { size: colWidth, type: WidthType.DXA },
      shading: isHeader ? { type: ShadingType.CLEAR, fill: INK } : undefined,
      margins: { top: 80, bottom: 80, left: 100, right: 100 },
      children: [new Paragraph({
        children: inline(cellTokens).map((r) =>
          isHeader && !(r instanceof ExternalHyperlink)
            ? mkRun(Object.assign({}, extraFromRun(r), { color: "F2EFE6", bold: true }))
            : r
        ),
      })],
    });
  }

  const rows = [];
  rows.push(new TableRow({
    tableHeader: true,
    children: tok.header.map((h) => cell(h.tokens, true)),
  }));
  for (const row of tok.rows) {
    rows.push(new TableRow({ children: row.map((c) => cell(c.tokens, false)) }));
  }
  return new Table({
    columnWidths: colWidths,
    width: { size: CONTENT_DXA, type: WidthType.DXA },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      left: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      right: { style: BorderStyle.SINGLE, size: 4, color: LINE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: LINE },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: LINE },
    },
    rows,
  });
}

function hr() {
  return new Paragraph({
    text: "",
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: LINE, space: 4 } },
    spacing: { before: 120, after: 120 },
  });
}

function blockquote(tok) {
  const paras = [];
  for (const child of tok.tokens) {
    if (child.type === "paragraph") {
      paras.push(new Paragraph({
        children: inline(child.tokens),
        indent: { left: 360 },
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 8 } },
        italics: true,
        spacing: { after: 80 },
      }));
    }
  }
  return paras;
}

function codeBlock(tok) {
  return tok.text.split("\n").map((line) =>
    new Paragraph({
      children: [mkRun({ text: line || " ", font: MONO, size: 20 })],
      shading: { type: ShadingType.CLEAR, fill: "F2EFE6" },
      spacing: { after: 0 },
    })
  );
}

function build(tokens) {
  const children = [];
  for (const tok of tokens) {
    switch (tok.type) {
      case "heading":
        children.push(new Paragraph({
          heading: headingLevel(tok.depth),
          children: inline(tok.tokens),
          spacing: { before: tok.depth === 1 ? 0 : 240, after: 120 },
        }));
        break;
      case "paragraph":
        children.push(paragraphFromTokens(tok.tokens, { spacing: { after: 120 } }));
        break;
      case "list":
        children.push(...listParagraphs(tok, tok.ordered ? "numbers" : "bullets", 0));
        break;
      case "table":
        children.push(tableFromToken(tok));
        children.push(new Paragraph({ text: "", spacing: { after: 120 } }));
        break;
      case "hr":
        children.push(hr());
        break;
      case "blockquote":
        children.push(...blockquote(tok));
        break;
      case "code":
        children.push(...codeBlock(tok));
        break;
      case "space":
        break;
      default:
        if (tok.tokens) children.push(paragraphFromTokens(tok.tokens, { spacing: { after: 120 } }));
    }
  }
  return children;
}

const tokens = marked.lexer(src, { gfm: true, breaks: false });
const body = build(tokens);

const doc = new Document({
  creator: "AgrosTech",
  title: titleArg || path.basename(inFile, ".md"),
  styles: {
    default: {
      document: { run: { font: FONT, size: 22, color: INK } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 36, bold: true, color: INK },
        paragraph: { spacing: { before: 0, after: 160 }, border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: GOLD, space: 4 } } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 28, bold: true, color: INK },
        paragraph: { spacing: { before: 240, after: 120 } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 24, bold: true, color: MUTED },
        paragraph: { spacing: { before: 200, after: 100 } } },
      { id: "Heading4", name: "Heading 4", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: FONT, size: 22, bold: true, italics: true, color: MUTED },
        paragraph: { spacing: { before: 160, after: 80 } } },
    ],
  },
  numbering,
  sections: [{
    properties: {
      page: {
        size: { width: PAGE.width, height: PAGE.height, orientation: PageOrientation.PORTRAIT },
        margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
      },
    },
    children: body,
  }],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync(outFile, buf);
  console.log("wrote", outFile);
});
