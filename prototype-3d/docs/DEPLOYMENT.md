# Share the finished game

The deployable application is **prototype-3d/dist/**, produced by `npm run build` in this folder. It is independent of the original game at the repository root. No backend, accounts, API keys or database are required by the application.

## Build and check locally

```sh
cd prototype-3d
npm ci
npm run build
npm run preview -- --port 4173
```

Open http://127.0.0.1:4173/. Test New Journey, Presenter Mode, a boss and a research chart. Serve over HTTP/HTTPS; opening `dist/index.html` directly with `file://` will not load modules/data reliably. Deployment should use the production build, not the Vite development server.

## Publish to any static host

Upload **the contents** of `dist/`, preserving its folders and license files. Set the host's publish/output directory to `prototype-3d/dist` when building from the repository root, and its build command to `cd prototype-3d && npm ci && npm run build`. If the host's project root is already `prototype-3d`, use `npm ci && npm run build` and output `dist`.

Use HTTPS. The relative Vite base (`./`) supports hosting at either a domain root or a repository subdirectory. There are no client-side route rewrites to configure. Paths are case-sensitive on most static hosts. Do not flatten `assets/`, `models/`, `art/`, `data/`, `research/` or `vendor/`. Preserve `models/LICENSE.txt` and the Plotly/font licenses.

For GitHub Pages, deploy `dist` as the Pages artifact through your repository's Pages workflow, or copy its contents into the configured Pages branch/folder and include an empty `.nojekyll` file there. Select the intended 3D app; the repository's existing root-game workflow may publish the separate original game. Do not replace that deployment accidentally.

After upload, open the public URL in a fresh browser profile. Check that models and JSON requests return 200, all four chapter options work in Presenter Mode, the Codex renders its local charts, and a normal save survives reload. Check on an actual classmate's integrated-GPU laptop before the presentation. Leave Performance Mode enabled by default.

## What is and is not published

Only build output is needed. Do not upload `node_modules`, test results, QA captures, source-art archives or development profiling tools. The original notebook and verified exports intentionally ship in the public build as downloadable research evidence. Browser saves are local to that host and browser; changing hostnames creates a separate save. Presenter Mode is safe for repeated live demonstrations.

A production build is prepared locally. No public hosting account or URL is created by these instructions.
