# hevy-mcp

🇺🇸 English · 🇧🇷 [Português](README.pt-BR.md)

An [MCP](https://modelcontextprotocol.io) server that connects AI assistants (Claude, Codex) to the [Hevy Public API](https://api.hevyapp.com/docs/).

```
Claude / Codex ──MCP stdio──▶ hevy-mcp ──HTTPS (api-key header)──▶ api.hevyapp.com/v1
```

## Requirements

- Hevy **Pro** + API key: https://hevy.com/settings?developer
- Node.js ≥ 18

## Installation

```bash
git clone https://github.com/viniciolimadev/integracao-hevy-ai
cd integracao-hevy-ai
npm install && npm run build
```

### Claude Code

```bash
claude mcp add hevy -e HEVY_API_KEY=your-key -- node /path/to/integracao-hevy-ai/dist/index.js
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "hevy": {
      "command": "node",
      "args": ["/path/to/integracao-hevy-ai/dist/index.js"],
      "env": { "HEVY_API_KEY": "your-key" }
    }
  }
}
```

### Codex (OpenAI)

```bash
codex mcp add hevy --env HEVY_API_KEY=your-key -- node /path/to/integracao-hevy-ai/dist/index.js
```

Or in `~/.codex/config.toml`:

```toml
[mcp_servers.hevy]
command = "node"
args = ["/path/to/integracao-hevy-ai/dist/index.js"]
env = { HEVY_API_KEY = "your-key" }
```

## Tools

| Group | Read | Write |
|---|---|---|
| User | `get_user_info` | — |
| Workouts | `list_workouts`, `get_workout`, `get_workout_count`, `get_workout_events` | `create_workout`, `update_workout` |
| Routines | `list_routines`, `get_routine` | `create_routine`, `update_routine` |
| Routine folders | `list_routine_folders`, `get_routine_folder` | `create_routine_folder` |
| Exercises | `list_exercise_templates` (with `search`), `get_exercise_template`, `get_exercise_history` | `create_exercise_template` |
| Body measurements | `list_body_measurements`, `get_body_measurement` | `create_body_measurement`, `update_body_measurement` |

- Automatic pagination via `max_items`.
- Retry with exponential backoff on 429/5xx.
- `update_body_measurement` overwrites every field: omitted fields become `null`.

## Example prompts

- "Summarize my last 4 weeks of training: volume per muscle group and frequency."
- "How has my bench press load progressed over the last 3 months?"
- "Create a Push/Pull/Legs routine in a 'Hypertrophy' folder."
- "Log today's body weight: 82.4 kg."

## Environment variables

| Variable | Default |
|---|---|
| `HEVY_API_KEY` | required |
| `HEVY_BASE_URL` | `https://api.hevyapp.com` |

## Disclaimer

Unofficial community project, not affiliated with Hevy. The Hevy Public API is in an early stage and may change.

## License

[MIT](LICENSE)
