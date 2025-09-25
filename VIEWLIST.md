# Community Hub View Guide

## Layout Overview
The product pairs a Vite-powered React front-end with an Express backend. Community cards contain nested board and post cards so that each community page can summarize activity at a glance.

## Navigation Rules
- Communities are sorted by their daily visit count and rendered in descending order.
- Boards are grouped under the community they belong to, and each board displays its latest posts.
- Trending shortcuts highlight the top three boards with an accent badge; the remainder use a subdued treatment.
- The navigation mega menu lists quick links to platform, series, genre, and resource filters for the game hub.

## Data Shapes
### Board
```json
{
  "id": "string",
  "title": "string",
  "order": 10,
  "deleted": false
}
```

### Post
```json
{
  "id": "string",
  "board_id": "string",
  "title": "string",
  "content": "string",
  "author": "string",
  "views": 120,
  "comments_count": 4,
  "created_at": "ISO8601",
  "updated_at": "ISO8601"
}
```

## Mock Generation
The mock backend fabricates:
- 6 communities
- 4?6 boards per community
- 12?20 posts per board
All timestamps are randomized within the past 45 days. View and comment counts are scaled so retaining boards surface higher engagement.

## Batch Scripts
| Script | Purpose |
| --- | --- |
| `start-all.bat` | Start real backend + front-end |
| `run-mock-all.bat` | Launch mock backend and the front-end |
| `run-frontend.bat` | Start only the front-end dev server |
| `run-backend.bat` | Start only the backend |
| `stop-all.bat` | Stop any dev servers started by the helpers |

Both backend and mock services listen on port **50000**. The front-end dev server listens on port **5000**.
