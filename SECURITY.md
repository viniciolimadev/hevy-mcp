# Security policy

## Handling your API key

- Your Hevy API key gives **full read and write access** to your Hevy account. Treat it like a password.
- Pass it only through the `HEVY_API_KEY` environment variable in your MCP client config. Never put it in source code.
- The server sends the key only to `api.hevyapp.com`, or to `HEVY_BASE_URL` if you override it. It never logs the key.
- If a key leaks, generate a new one at https://hevy.com/settings?developer.

## Write operations

The `update_*` tools **overwrite** data. `update_body_measurement` sets omitted fields to `null`. These tools are annotated with `destructiveHint`, so MCP clients can ask for confirmation before running them. Keep that confirmation turned on.

## Reporting a vulnerability

Please **do not open a public issue**. Report it privately through [GitHub Security Advisories](https://github.com/viniciolimadev/integracao-hevy-ai/security/advisories/new). You can expect a response within 7 days.
