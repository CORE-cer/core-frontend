# Core Frontend

React + TypeScript frontend built with Vite, MUI, and TanStack Router.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/) (v10.6.1+ — bundled via `packageManager` in `package.json`, so `corepack enable` will handle it)

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:8080
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start the dev server (runs on http://localhost:3000)
pnpm dev
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite dev server on port 3000 |
| `pnpm build` | Build for production |
| `pnpm serve` | Preview the production build locally |
| `pnpm test` | Run tests with Vitest |
| `pnpm format` | Check linting and formatting |
| `pnpm format-fix` | Auto-fix linting and formatting issues |
