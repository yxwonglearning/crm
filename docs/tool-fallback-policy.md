# Tool fallback policy

Determine whether failure comes from implementation, pre-existing state, dependencies, configuration, runtime/browser installation, permissions, environment, or the tool. Fix implementation-caused failures and rerun; do not invent results or make unrelated changes to force a tool.

If Graphify fails, use targeted source inspection, search, docs, and history. If Playwright fails, use relevant unit/integration/build/code checks and disclose missing browser validation. Inspect scripts, configuration, docs, and CI before choosing an unknown command. Do not broadly alter the environment solely to enable a tool. Disclose every failed/unavailable verification.

If Context7 is relevant but unavailable, use authoritative vendor documentation or verified local dependency documentation where accessible, record the source and version assumptions, and disclose that Context7 was not used. If Strix is relevant but unavailable or lacks an authorized/runnable target, perform the strongest applicable code-level and existing security checks, explain the missing prerequisite, and disclose that no Strix scan completed. Never substitute a fallback while claiming the named tool ran.
