# Contributing

Thanks for your interest in improving hevy-mcp!

## Development setup

```bash
git clone https://github.com/viniciolimadev/integracao-hevy-ai
cd integracao-hevy-ai
npm install
npm run build
```

Test the server interactively with the [MCP Inspector](https://github.com/modelcontextprotocol/inspector):

```bash
HEVY_API_KEY=your-key npx @modelcontextprotocol/inspector node dist/index.js
```

## Adding or changing a tool

1. Register the tool in `src/index.ts` with `server.registerTool`.
   - Write the `description` in English, in one sentence, from the model's point of view.
   - Validate every input with zod, and add `.describe()` to any field that isn't obvious.
   - Set `annotations`: `readOnly` for GET, `write` for POST, and `destructiveHint: true` for PUT.
2. Use `hevy.paginate(...)` for list endpoints. Don't expose raw `page` and `pageSize` parameters.
3. Rebuild and regenerate the reference: `npm run build && npm run docs:tools`.
4. Add an entry to [`CHANGELOG.md`](CHANGELOG.md) under **Unreleased**.

CI fails if `docs/tools.md` is out of date.

## Pull requests

- Keep each PR focused on one change.
- Use clear, imperative commit messages, e.g. `Add get_routine_folder tool`.
- Never commit API keys or `.env` files.
