# Share the finished game

The deployable application is **prototype-3d/dist/**, produced by `npm run build` in this folder. It is independent of the earlier 2D prototype at the repository root. The application needs no backend, accounts, API keys or database.

## GitHub Pages (automatic)

The repository workflow `.github/workflows/pages.yml` builds and publishes this game on every push to `main`. It can also be started by hand from the **Actions** tab. It runs `npm ci`, the unit tests and `npm run build` in `prototype-3d/`, checks that every runtime asset is in `dist/`, and deploys `dist/` as the Pages artifact.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The site then appears at `https://<user>.github.io/beyond-the-sparkle/`, and the link is shown on the workflow run's `deploy` job.

The Vite base is relative (`./`), and every runtime URL (models, textures, data, Plotly, notebook) is built from `import.meta.env.BASE_URL`. The same build therefore works under the repository sub-path, at a custom-domain root and in `vite preview`. There are no client-side routes, so no 404 or rewrite configuration is needed. Actions-based Pages deployments do not run Jekyll, so no `.nojekyll` file is required.

### Custom domain (optional)

A custom domain is set in **Settings → Pages → Custom domain**; with Actions deployments, a `CNAME` file in the repository is ignored. The domain only works once its DNS points at GitHub Pages:

- the apex (`example.com`) needs A records `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`;
- `www` needs a CNAME record to `<user>.github.io`.

While a custom domain is set, the `github.io` address redirects to it. If the DNS is not pointed at GitHub, the game will be unreachable, so remove the domain until the DNS is ready.

## Build and check locally

```sh
cd prototype-3d
npm ci
npm run build
npm run preview -- --port 4173
```

Open http://127.0.0.1:4173/. Test New Journey, Presenter Mode, a boss and a research chart. Serve over HTTP or HTTPS: opening `dist/index.html` directly with `file://` will not load modules and data reliably. Deploy the production build, never the Vite development server.

## Other static hosts

Upload **the contents** of `dist/`, preserving its folders and license files. If the host builds from the repository root, set the build command to `cd prototype-3d && npm ci && npm run build` and the output directory to `prototype-3d/dist`. Paths are case-sensitive on most hosts. Do not flatten `assets/`, `models/`, `art/`, `data/`, `research/`, `licenses/` or `vendor/`.

## After publishing

Open the public URL in a fresh browser profile. Check that:

- the models and JSON requests return 200;
- all four chapters work in Presenter Mode;
- the Codex renders its charts;
- a normal save survives a reload.

Before presenting, try it on a classmate's integrated-GPU laptop, and leave Performance Mode on (it is the default).

## What is and is not published

Only the build output is published. `node_modules`, test results, QA captures, source-art archives and profiling tools stay out. The original notebook and verified exports deliberately ship in the build as downloadable research evidence. Browser saves belong to the site's address: a save made on localhost, `github.io` or a custom domain stays with that address. Presenter Mode never writes the story save.
