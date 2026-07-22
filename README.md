# Airbnb Monitor

Interactive map web app built with Vite, React, and Leaflet. The app is a static SPA served by nginx in production; all map logic runs in the browser.

## Prerequisites

- [Node.js](https://nodejs.org/) 22+ (for local npm development)
- [Docker](https://www.docker.com/) (for containerized local run and deployment)

## Local development (npm)

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Local development (Docker with HMR)

```bash
docker compose -f docker-compose.dev.yml up
```

Open [http://localhost:5173](http://localhost:5173). Source is mounted into the container; Vite hot-reloads on changes.

## Production-like local run (Docker)

Build and serve the static production bundle via nginx:

```bash
docker compose up --build
```

Open [http://localhost:8080](http://localhost:8080).

## Build

```bash
npm run build
```

Output is written to `dist/`.

## Docker image (CI)

On push to `main`, tagged releases (`v*`), or manual workflow dispatch, GitHub Actions builds and pushes the image to GitHub Container Registry:

```
ghcr.io/isr-oeaw/airbnb-monitor
```

Workflow: [.github/workflows/docker.yml](.github/workflows/docker.yml)

### Pull and run published image

```bash
docker pull ghcr.io/isr-oeaw/airbnb-monitor:latest
docker run --rm -p 8080:80 ghcr.io/isr-oeaw/airbnb-monitor:latest
```

Open [http://localhost:8080](http://localhost:8080).

If the package is private, authenticate first:

```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Project structure

```
src/                 React app source
src/components/      Map and UI components
public/              Static assets
nginx/               nginx config for production container
Dockerfile           Multi-stage build (Node → nginx)
docker-compose.yml   Production-like local run
docker-compose.dev.yml  Dev server with HMR
```

## Map

The starter map uses [OpenStreetMap](https://www.openstreetmap.org/) tiles via [Leaflet](https://leafletjs.com/) and is centered on Vienna. No API key is required.
