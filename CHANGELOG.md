# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-10-08

First public release.

### Added
- MCP server covering every Hevy Public API v1 endpoint (22 tools): workouts, workout events, routines, routine folders, exercise templates, exercise history, body measurements and user info.
- Automatic pagination through `max_items`.
- Retry with exponential backoff on HTTP 429 and 5xx.
- Client-side `search` for exercise templates.
- MCP tool annotations (read-only / write / destructive) so clients can confirm before changing data.
- Setup guides for Claude Code, Claude Desktop and Codex.
- Documentation: architecture, auto-generated tool reference, contributing guide, security policy.
- CI on Node 20 and 22, plus a release workflow.
- MIT license.

[Unreleased]: https://github.com/viniciolimadev/hevy-mcp/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/viniciolimadev/hevy-mcp/releases/tag/v0.1.0
