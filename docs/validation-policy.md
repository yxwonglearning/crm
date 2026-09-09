# Validation policy

Validate at coherent checkpoints after the complete affected change, not after every small edit. Trivial work gets lightweight relevant checks. Meaningful work gets applicable syntax/type/build, formatting, lint, unit, integration, and regression checks.

For completed UI/workflow changes, run relevant Playwright once at the checkpoint and verify the primary flow and important states. Rerun only checks affected by later edits. High-risk work additionally validates auth, input, exposure, permissions, external inputs, and trust boundaries. Never claim a check passed unless it ran successfully. After every Playwright testing is done, remember to close the Windows that perform testing.

## Strix security testing

Strix security-testing skills are available for scoped application, API, repository, and CI security assessment. Use the appropriate Strix workflow after meaningful security-sensitive code changes have been implemented and ordinary relevant tests are stable. Define and keep the scan within the user-authorized target and test environment.

Run Strix once at the security-validation checkpoint, not after every file or minor edit. Rerun it only when a later change affects the assessed security boundary or when validating a security fix. Do not target production systems, external assets, or broader infrastructure without explicit authorization. Report the scan scope, executed workflow, findings, remediations, and unresolved limitations. Never describe a generic review as a completed Strix scan.
