# Incident policy

Assess impact/state before acting; do not panic-edit production or rewrite shared history. Fix local unshared work normally. For pushed branches prefer a forward fix and revalidation. For merged/shared work prefer revert for severe, security/data-risk, or uncertain issues; prefer a forward fix when the cause and low-risk correction are clear and quickly verifiable.

Do not force-push, reset shared branches, revert merged work, redeploy, or alter production data without authorization. Explain immediate security/integrity risks and recommend containment. Afterwards identify cause, restore behavior, test regressions, improve tests, document lessons, update tracking, and refresh Graphify if code meaningfully changed.
