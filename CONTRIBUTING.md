# Contributing

Thanks for your interest in improving hevy-mcp!

## Development setup

```bash
git clone https://github.com/viniciolimadev/hevy-mcp
cd hevy-mcp
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

## Releasing (maintainers)

1. Bump `version` in `package.json` and in `src/index.ts` (`new McpServer({ version })`).
2. Move the **Unreleased** entries in `CHANGELOG.md` to a new `## [x.y.z] - YYYY-MM-DD` section.
3. Merge to `main`, then tag and push:
   ```bash
   git tag vX.Y.Z && git push origin vX.Y.Z
   ```
4. The **Release** workflow checks the tag against `package.json` and publishes a GitHub release using the CHANGELOG section as release notes.
