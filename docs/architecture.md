# Architecture

## Overview

```mermaid
flowchart LR
    subgraph Client["AI client"]
        A[Claude Code / Claude Desktop / Codex]
    end
    subgraph Server["hevy-mcp (local process)"]
        B[MCP tools<br/><code>src/index.ts</code>]
        C[HTTP client<br/><code>src/hevy-client.ts</code>]
    end
    D[(api.hevyapp.com/v1)]

    A -- "MCP over stdio" --> B
    B -- "validated args (zod)" --> C
    C -- "HTTPS + api-key header" --> D
```

The server runs locally as a child process of the AI client. It talks MCP over stdio and does not open any network port.

## Request lifecycle

```mermaid
sequenceDiagram
    participant AI as AI client
    participant T as MCP tool
    participant H as HevyClient
    participant API as Hevy API

    AI->>T: tools/call list_workouts { max_items: 25 }
    T->>T: validate input (zod schema)
    loop until max_items reached or last page
        T->>H: GET /v1/workouts?page=n&pageSize=10
        H->>API: request (api-key header)
        alt 429 or 5xx
            API-->>H: error
            H->>H: backoff 0.5s → 1s → 2s (max 3 retries)
            H->>API: retry
        end
        API-->>H: { page, page_count, workouts }
    end
    H-->>T: items
    T-->>AI: JSON text result (or isError + message)
```

## Modules

| File | Responsibility |
|---|---|
| `src/index.ts` | Declares the MCP tools, their input schemas (zod), and annotations (read-only / write / destructive) |
| `src/hevy-client.ts` | HTTP layer: authentication, query building, JSON parsing, retries, pagination |
| `scripts/gen-tools-doc.mjs` | Generates [`docs/tools.md`](tools.md) from the live tool schemas |

## Design decisions

| Decision | Reason |
|---|---|
| One tool per API endpoint | Predictable for the model; mirrors the official docs |
| Automatic pagination (`max_items`) | The API caps page sizes (10 for most resources), so the model shouldn't have to loop |
| Client-side `search` for exercise templates | The API has no search endpoint; IDs are required to create workouts and routines |
| Tool annotations (`readOnlyHint`, `destructiveHint`) | Lets clients ask for confirmation before write or overwrite operations |
| Errors returned as `isError` results | The model sees the Hevy error message and can fix its own input |
| No local cache or scheduled sync | Keeps the server stateless; `get_workout_events` covers incremental sync for clients that need it |

## Rate limits

The server only calls the API when a tool is invoked. If you build periodic syncs on top of it, follow Hevy's guidance and **do not schedule requests at minute `xx:00`**. Pick a random minute instead.
