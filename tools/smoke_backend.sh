#!/usr/bin/env bash
set -euo pipefail
python -m pytest -q backend/tests
cd mobile
node --experimental-strip-types --test src/domain/rules.test.ts
