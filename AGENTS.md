<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Architecture

- Crea-Link is one TanStack Start app: public `/`, `/auth`, `/reset-password`; everything else lives under `src/routes/_authenticated/` (client-only gate) whose layout also sends un-onboarded users to `/onboarding`. Why: one auth, one profile, one navigation for all merged modules.
- `src/lib/store.tsx` (StoreProvider) is the single source for the signed-in user, profiles, connections and the project feed, with realtime refresh. Why: discovery, feed and profile pages must see the same live data.
- The studio module (`src/modules/creative-studio`) talks to the backend only through `services/studioService.ts`, which keeps the original Firestore-era method signatures. Why: lets the original studio components run unchanged on Lovable Cloud.
- Story assistant AI runs only in `storyAssistant.functions.ts` (authenticated server function, Lovable AI Gateway, strict JSON schema); there is no demo fallback. Why: never show fake AI output.
- Genre → pastel palette resolution lives only in `src/lib/genre-theme.ts` (`paletteForGenre`); studio, discovery and assistant themes all derive from it, and the primary genre wins. Why: one consistent per-project colour system.
- Storage buckets are private; files are stored as `sb://bucket/path` refs and shown via signed URLs (`src/lib/storage-urls.ts`). Why: the workspace blocks public buckets.
- Research opens external sites (Google search, or copies a prompt for ChatGPT/Claude/Gemini); it is not an in-app AI search. Why: preserves the original module's honest behaviour.
