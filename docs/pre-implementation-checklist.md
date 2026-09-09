# Pre-implementation checklist

Confirm the outcome and specification; classify risk; inspect existing code; consult Graphify/history; identify dependencies, the smallest file set, and regressions; preserve architecture unless change is justified.

For UI/UX, consult Apple Design guidance and consider consistency, responsiveness, accessibility, and relevant loading/empty/success/error states. For security-sensitive work, review authentication, authorization, validation, exposure, permissions, and trust boundaries. Present material alternatives and trade-offs, then obtain approval before changing scope, architecture, behavior, or design direction.

## Context7

Context7 is an expected project tool when it is exposed in the current Codex session. Before meaningful implementation involving a third-party library, framework, SDK, API, integration, configuration format, or version-specific behavior, use Context7 to consult current authoritative documentation and examples. Use the findings to confirm supported APIs, versions, configuration, security guidance, and migration requirements before coding.

Do not invoke Context7 for trivial documentation changes or work governed entirely by stable local code. If it is relevant but unavailable, follow the tool fallback policy and disclose the limitation; never imply Context7 was used when it was not.
