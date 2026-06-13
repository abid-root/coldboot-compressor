# FlowSync Image Compressor

FlowSync is a deploy-ready, browser-based image compressor and converter for JPG, PNG, and WebP files.

## What works

- Upload by click or drag/drop
- JPG, PNG, and WebP input support
- Same-format browser optimization
- Auto Convert mode: WEBP, JPEG, PNG
- Transparent PNG/WebP to JPEG uses a white background
- Max 20 images per batch
- Max 50MB per file
- Clear skipped-file messages
- Single-file download
- ZIP download with no CDN dependency
- Light/dark theme
- Mobile-friendly layout

## Deploy

This is a static site. It can be deployed on GitHub Pages, Netlify, Cloudflare Pages, Vercel Static, or any normal static host.

Open `index.html` locally or publish the whole folder.

## Limitations

This public version is frontend-only. It is good for a portfolio/demo tool, but it is not a professional TinyPNG-level backend compressor. Browser PNG optimization is limited. For stronger compression later, add a Node.js backend with Sharp.
