# hevy-mcp

Servidor [MCP](https://modelcontextprotocol.io) que conecta o Claude à [API pública do Hevy](https://api.hevyapp.com/docs/).

```
Claude (Code/Desktop) ──MCP stdio──▶ hevy-mcp ──HTTPS (header api-key)──▶ api.hevyapp.com/v1
```

## Requisitos

- Hevy **Pro** + API key: https://hevy.com/settings?developer
- Node.js ≥ 18

## Instalação

```bash
npm install && npm run build
```

### Claude Code

```bash
claude mcp add hevy -e HEVY_API_KEY=sua-chave -- node /caminho/integra-o-hevy-ai/dist/index.js
```

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "hevy": {
      "command": "node",
      "args": ["/caminho/integra-o-hevy-ai/dist/index.js"],
      "env": { "HEVY_API_KEY": "sua-chave" }
    }
  }
}
```

### Codex (OpenAI)

```bash
codex mcp add hevy --env HEVY_API_KEY=sua-chave -- node /caminho/integra-o-hevy-ai/dist/index.js
```

Ou em `~/.codex/config.toml`:

```toml
[mcp_servers.hevy]
command = "node"
args = ["/caminho/integra-o-hevy-ai/dist/index.js"]
env = { HEVY_API_KEY = "sua-chave" }
```

## Ferramentas

| Grupo | Leitura | Escrita |
|---|---|---|
| Usuário | `get_user_info` | — |
| Treinos | `list_workouts`, `get_workout`, `get_workout_count`, `get_workout_events` | `create_workout`, `update_workout` |
| Rotinas | `list_routines`, `get_routine` | `create_routine`, `update_routine` |
| Pastas | `list_routine_folders`, `get_routine_folder` | `create_routine_folder` |
| Exercícios | `list_exercise_templates` (com `search`), `get_exercise_template`, `get_exercise_history` | `create_exercise_template` |
| Medidas | `list_body_measurements`, `get_body_measurement` | `create_body_measurement`, `update_body_measurement` |

- Paginação automática via `max_items`.
- Retry com backoff em 429/5xx.
- `update_body_measurement` sobrescreve tudo: campos omitidos viram `null`.

## Exemplos de prompts

- "Resuma meus treinos das últimas 4 semanas: volume por grupo muscular e frequência."
- "Como evoluiu minha carga no supino nos últimos 3 meses?"
- "Crie uma rotina Push/Pull/Legs na pasta 'Hipertrofia'."
- "Registre meu peso de hoje: 82,4 kg."

## Variáveis

| Var | Padrão |
|---|---|
| `HEVY_API_KEY` | obrigatória |
| `HEVY_BASE_URL` | `https://api.hevyapp.com` |

## Licença

[MIT](LICENSE)
