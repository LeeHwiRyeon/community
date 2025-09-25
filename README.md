# Community Hub

Community Hub is a React + TypeScript front-end backed by an Express mock API for exploring community posts, trending topics, and nested boards. The project runs locally with the backend on port 50000 and the front-end dev server on port 5000.

## Prerequisites
- Node.js 18 or 20 LTS
- npm 8+
- Git

## Install Dependencies
```bash
# backend
cd server-backend
npm install

# front-end
cd ../frontend
npm install
```

## Running Locally
The repo ships with batch scripts to make startup easy:
- `scripts/run-all.bat` ? launch backend + front-end using real data
- `scripts/run-mock-all.bat` ? launch the mock backend plus the front-end
- `scripts/run-backend.bat` / `scripts/run-frontend.bat` ? start each side individually
- `scripts/run-frontend-old.bat` ? start the legacy front-end test server
- `scripts/stop-all.bat` ? stop any dev processes started by the scripts

**Port Usage:**
- Backend API: 50000
- Front-end dev server: 5000
- Playwright test runner: 9323 (cleaned up by stop scripts)

If you prefer manual commands:
```bash
# backend
cd server-backend
npm run dev

# front-end (in a second terminal)
cd frontend
npm run dev -- --host --port 5000
```

## Mock Data
When the backend starts with `USE_MOCK_DB=1`, community, board, and post documents are generated on the fly. Each community contains boards, each board contains posts, and posts include counts for views, comments, and recent activity.

## Testing
Playwright smoke tests live under `server-backend/tests/e2e`. Run them with:
```bash
cd server-backend
npx playwright test
```

**Playwright Configuration:**
- Test runner uses port 9323 for browser automation
- If port 9323 is in use, tests may fail - the `stop-all.bat` script will clean up this port
- Browser binaries are downloaded automatically on first run

## Troubleshooting
- Ensure ports 5000 and 50000 are free before starting.
- Delete the `.vite` cache if the front-end fails to pick up CSS updates.
- Re-run `npm install` inside `frontend` if UI dependencies appear missing.
- **Text Encoding Issues**: Mock server responses are UTF-8 encoded to prevent character corruption (e.g., Greek text displaying as ???). If encoding issues persist, verify client-side UTF-8 handling.
