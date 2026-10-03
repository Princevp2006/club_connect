<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All backend calls go through `src/api/apiClient.js` + `src/api/index.js`; components never call fetch directly — keeps auth/error handling centralized.
- Endpoints marked `ASSUMED` in `src/api/index.js` are not in the spec; verify against backend Swagger before relying on them.
- `VITE_USE_MOCK_API=true` routes requests to the isolated `src/api/mock/` layer; never import mock code elsewhere — prevents fake data leaking into production.
- Auth is JWT in localStorage via `AuthContext`; protected pages live under `src/routes/_authenticated/` (ssr: false) with role layouts `admin/`, `leader/`, `_student/` — UI gating only, backend is the authority.
- Source files are plain JavaScript (.jsx/.js), no TypeScript — user preference; only generated routeTree.gen.ts stays .ts.
