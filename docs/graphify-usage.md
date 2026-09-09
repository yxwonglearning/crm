# Graphify usage

Use the knowledge graph in `graphify-out/` for relationships and historical decisions. Before meaningful changes, use `graphify query "<question>"`; use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused analysis. Prefer `wiki/index.md` for broad navigation and `GRAPH_REPORT.md` only when scoped commands are insufficient. Dirty graph output is not a reason to skip it.

Run `graphify update .` once at the post-implementation checkpoint after a meaningful code change, not after each file or small edit. It is normally unnecessary for trivial documentation, comments, or typos. Follow the fallback policy if unavailable.
