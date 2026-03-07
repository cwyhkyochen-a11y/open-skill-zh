#!/usr/bin/env bash
set -euo pipefail
cd /root/.openclaw/workspace/skills/content-ops
npx --yes tsx scripts/x_post_api.ts "$@"
