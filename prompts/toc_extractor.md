# TOC Extractor (Fallback)

> Used by `pipeline/ingest_pdf.py::_gemini_toc_fallback` when pypdf outline is missing.

---

From the following table-of-contents-like text, extract a flat list of
sections in JSON form:

```json
[
  { "title": "string", "page_start": 0, "page_end": 12 }
]
```

## Rules

- Page numbers are 0-indexed (not 1-indexed)
- If unclear or text is messy, split into ~5 equal parts spanning the full document
- Do NOT include page numbers, headers, or footers as section titles
- Strip leading numbering (e.g. "Chapter 1: ...") to keep just the title body
