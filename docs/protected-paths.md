# Protected paths

Do not manually edit generated, vendor, dependency, build, cache, Graphify output, generated client/type, or compiled files when a source/generator exists, including `node_modules/`, `dist/`, `build/`, `.next/`, and `coverage/`.

Never hand-edit lockfiles; allow legitimate package tools to update them. Treat applied migrations as immutable history and normally create a new migration. Never expose or commit credentials, production secrets, certificates, tokens, or secret-bearing `.env` files; use safe examples where appropriate.
