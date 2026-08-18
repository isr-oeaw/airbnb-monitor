# Airbnb Monitor

Interactive map web app built with Vite, React, and Leaflet. The app is a static SPA served by nginx in production; all map logic runs in the browser.

## Features

- **Austria map** — tile-free Bundesländer boundaries rendered from GeoJSON
- **Clickable states** — click a Bundesland to see Airbnb regulation summaries
- **Address search** — autocomplete for Austrian addresses (Photon API), fly-to location with local regulation info
- **View toggle** — switch between **Regulierung** (regulation map) and **Impact Index** (Wien EHSA H3 hex map)
- **Wien impact index** — EHSA hex map with categorical lookup when searching a Vienna address

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (for local npm development)
- [Docker](https://www.docker.com/) (for containerized local run and deployment)

## Local development (npm)

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Local development (Docker with HMR)

From the repo root:

```bash
docker compose -f docker-compose.dev.yml up
```

Open [http://localhost:5173](http://localhost:5173). The `app/` folder is mounted into the container; Vite hot-reloads on changes.

## Production-like local run (Docker)

Build and serve the static production bundle via nginx:

```bash
docker compose up app --build
```

Open [http://localhost:8080](http://localhost:8080).

For development with HMR, use the `dev` service instead:

```bash
docker compose up dev
```

### Password protection (nginx only)

The production `app` service supports HTTP Basic Auth via environment variables in [`docker-compose.yml`](docker-compose.yml):

| Variable | Description |
|----------|-------------|
| `AUTH_ENABLED` | `true` / `false` (also `1` / `0`) |
| `AUTH_PASSWORD` | Required when auth is enabled |
| `AUTH_USER` | Username (default: `airbnb`) |

Example with protection enabled:

```yaml
environment:
  - AUTH_ENABLED=true
  - AUTH_USER=airbnb
  - AUTH_PASSWORD=your-secret
```

When enabled, the browser prompts for credentials before serving the SPA, static assets, and `/api/` routes. The Vite `dev` service is not protected.

## Build

```bash
cd app
npm run build
```

Output is written to `app/dist/`.

## Docker image (CI)

On push to `main`, tagged releases (`v*`), or manual workflow dispatch, GitHub Actions builds and pushes the image to GitHub Container Registry:

```
ghcr.io/isr-oeaw/airbnb-monitor
```

Workflow: [.github/workflows/docker.yml](.github/workflows/docker.yml)

### Pull and run published image

```bash
docker pull ghcr.io/isr-oeaw/airbnb-monitor:latest
docker run --rm -p 8080:80 \
  -e AUTH_ENABLED=true \
  -e AUTH_USER=airbnb \
  -e AUTH_PASSWORD=your-secret \
  ghcr.io/isr-oeaw/airbnb-monitor:latest
```

Open [http://localhost:8080](http://localhost:8080). Omit `AUTH_ENABLED` or set it to `false` for an open site.

If the package is private, authenticate first:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Project structure

```
app/                      Vite + React application
app/src/                  React app source
app/src/components/       Map, search, and info panel
app/src/data/             Bundesland regulation content (JSON)
app/src/lib/              Geocoding and geo utilities
app/public/data/          Austria Bundesländer GeoJSON, Wien Bezirke, EHSA H3 hexes
nginx/                    nginx config for production container
Dockerfile                Multi-stage build (Node → nginx)
docker-compose.yml        Production-like local run
docker-compose.dev.yml    Dev server with HMR
```

## Map data

Bundesländer boundaries are served from [`app/public/data/austria-bundeslaender.geojson`](app/public/data/austria-bundeslaender.geojson), derived from [Statistik Austria administrative boundaries](https://github.com/ginseng666/GeoJSON-TopoJSON-Austria) (CC BY 4.0). Shapefiles cannot be rendered directly in the browser; to update from official BEV VGD shapefiles:

```bash
ogr2ogr -f GeoJSON austria-bundeslaender.geojson input.shp
```

## Address geocoding

Address autocomplete uses the [Photon API](https://photon.komoot.io/) (Komoot/OSM), filtered to Austria via bounding box. No API key is required. Requests are debounced in the browser.

## Datenschutz and address logging

Users can optionally consent in the welcome **Info** box to log selected addresses on the server. Consent is stored in the browser (`localStorage`); without consent, the map works normally and no addresses are logged.

When consent is given, each submitted address search is appended to [`data/logs/address-searches.jsonl`](data/logs/address-searches.jsonl) via a small Node API ([`server/search-log.mjs`](server/search-log.mjs)). Editable legal copy lives in [`app/src/data/datenschutz.json`](app/src/data/datenschutz.json) and [`app/src/data/about.json`](app/src/data/about.json).

**Docker dev** (logger + Vite proxy):

```bash
docker compose up dev
```

The `logger` service listens on port 3001; Vite proxies `/api` to it.

**Local npm dev** — run the logger in a second terminal, then start Vite:

```bash
node server/search-log.mjs
cd app && npm run dev
```

Log file path defaults to `./data/address-searches.jsonl` when `LOG_FILE` is unset locally; set `LOG_FILE=./data/logs/address-searches.jsonl` to match Docker.

## Regulation content

Bundesland regulation summaries live in [`app/src/data/bundeslaender-regulations.json`](app/src/data/bundeslaender-regulations.json). Placeholder text is provided for all nine states and can be replaced with verified legal content without code changes.

## Wien impact index (EHSA H3 hexes)

The Impact Index view shows **H3 hex polygons** for Vienna from [`app/public/data/ehsa_h3_hexes_5class.geojson`](app/public/data/ehsa_h3_hexes_5class.geojson). Each hex has a 5-class EHSA classification (`ehsa_class5`) and color. Categorical colors are defined in [`app/public/data/ehsa_legend_5class.json`](app/public/data/ehsa_legend_5class.json).

District borders on the impact map come from [`app/public/data/wien-bezirke.geojson`](app/public/data/wien-bezirke.geojson), derived from [Stadt Wien Open Government Data — Bezirksgrenzen](https://data.wien.gv.at) (WFS `ogdwien:BEZIRKSGRENZEOGD`, EPSG:4326). To refresh:

```bash
curl -fsSL "https://data.wien.gv.at/daten/geo?service=WFS&request=GetFeature&version=1.1.0&typeName=ogdwien:BEZIRKSGRENZEOGD&srsName=EPSG:4326&outputFormat=json" \
  -o app/public/data/wien-bezirke.geojson
```

Address lookup uses point-in-polygon against the hex GeoJSON in the browser. Searching a Vienna address highlights the matching hex and shows the EHSA type in the info panel.

## Usage

1. Use the header toggle to switch between **Regulierung** and **Impact Index**.
2. In regulation mode, click a Bundesland or search an Austrian address for regulation info.
3. In impact mode, the Wien EHSA hex map is shown. Search a Vienna address to fly to the location, highlight the H3 cell, and display the EHSA classification in the info panel.
4. Addresses outside Vienna in impact mode show an error message in the panel.
