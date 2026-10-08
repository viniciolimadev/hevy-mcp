# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- English documentation: architecture, auto-generated tool reference, contributing guide, security policy.
- CI that builds the project and checks the tool reference is up to date.

### Changed
- Tool descriptions are now in English.

## [0.1.0] - 2026-10-08

### Added
- MCP server covering every Hevy Public API v1 endpoint: workouts, workout events, routines, routine folders, exercise templates, exercise history, body measurements, user info.
- Automatic pagination through `max_items`.
- Retry with exponential backoff on HTTP 429 and 5xx.
- Client-side `search` for exercise templates.
- Setup guides for Claude Code, Claude Desktop and Codex.
- MIT license.
