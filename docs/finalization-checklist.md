# Finalization checklist

Only after explicit acceptance, perform applicable steps once for the accepted unit: update Jira with verified details/status; refresh Graphify after meaningful code changes; update README/docs when setup, architecture, workflows, commands, configuration, APIs, environment variables, or documented functionality changed; perform final security checks for high-risk/security-sensitive work; review Git status/diff and follow Git policy.

For high-risk or security-sensitive code work, use the appropriate scoped Strix workflow for final security verification when it is available and the target is authorized. This may reuse a successful post-implementation scan when no later change affected its security boundary; do not repeat an unchanged scan solely because finalization began.

Do not run the whole finalization sequence after each small implementation step.
