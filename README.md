# Վարորդական թեստեր

Interactive practice app for the Armenian driving theory test (ABC categories), built from the 10 group PDFs (ԽՈՒՄԲ 1–10, 1,050 questions, 715 images). Question text is kept exactly as in the PDFs.

**Live:** https://thezzak.github.io/driver-test-am/

## Features

- **By group**: practise one group in order or shuffled
- **Random questions**: a shuffled mix from all groups (10 / 20 / 50 / 100 / all)
- **Custom mix**: pick any set of groups, a count and an order
- **Practice exam**: 20 questions spread across groups in proportion to their size, 30-minute timer, pass with ≤ 2 errors (all adjustable in Settings)
- **My mistakes**: every question you got wrong; it leaves the pool after 2 correct answers in a row
- **Bookmarks** (☆), **browse and search** with correct answers, per-group progress
- Works offline as an installable PWA; progress is stored in the browser

Keyboard: `1`–`9` answer · `Enter`/`→` next · `←` previous · `B` bookmark.

## Development

```bash
npm install
npm run dev
```

### Regenerating the data

The PDFs are not committed. Put `1.pdf` … `10.pdf` in the repo root and run:

```bash
pip install pymupdf pillow
npm run extract
```

This writes `public/data/questions.json` and `public/img/g{group}/q{n}.webp`. The script checks every question (count against the PDF header, sequential numbering, exactly one green-highlighted option, and that option matches the `Պատ.՝ N` line) and stops on any mismatch.

## Deploy

Every push to `main` builds and deploys to GitHub Pages through `.github/workflows/deploy.yml`.
