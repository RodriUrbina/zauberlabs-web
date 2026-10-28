# How we work on zauberlabs.de

zauberlabs.de is built and run by a small team of Claude Code agents. A product owner (the PO) makes the decisions and
approves every release. This page describes the setup as it is today.

## The team

| Session (tmux) | Role | Does |
| --- | --- | --- |
| `blog-editor` | **Editor** and release agent | Reviews and gates every pull request, and is **the only one who merges**. Checks production after a release and runs the morning check for scheduled articles. |
| `blog-builder` | **Builder** | Code and features: pages, the shop, APIs, tooling, tests. Never merges and writes no articles. |
| `blog-writer` | **Writer** | Articles and all site copy, in German and English. |
| E46 Coordinator (separate session) | Coordinator | Relays the PO's decisions and assigns work to the three agents. |

## Worktrees and branches

Each agent works in its own git worktree under `~/.a Projects/`:

| Worktree | Used by | Notes |
| --- | --- | --- |
| `zauberlabs-web` | — | The main checkout, on `main`. It's stale and not used by the agents. |
| `zauberlabs-web-editor` | Editor | Branch `editor/setup`; gates run on a detached checkout. |
| `zauberlabs-web-builder` | Builder | One branch per card: `builder/BL-<n>-<slug>`. |
| `zauberlabs-web-writer` | Writer | One branch per card: `writer/BL-<n>-<slug>`. |

Every branch starts from the current `origin/main`. Each card gets one pull request, and commit messages start with
the card id.

**Local ports:** Builder 3010, Writer 3011, Editor 3012.

## Cards: BL numbers

- Work is tracked on the Trello board **"ZAUBERLABS — Blog"**. The lists run from **IDEAS** through
  **READY TO PUBLISH (PO approved)** to **PUBLISHED**.
- A card is `BL-<nnn>`, the next free number on that board. Follow-ups to a card are `BL-<n>.<k>`.

## The gate (Editor)

Before the PO is asked to approve a pull request, the Editor gates it on port 3012:

1. Check that `/tmp/e46-gate.lock` does not exist and that the machine load is below 6. The E46 project runs
   load-sensitive gates on the same machine.
2. Merge the pull request onto `origin/main` in a detached preview checkout.
3. `npm ci --legacy-peer-deps`
4. `npx tsc --noEmit`
5. `npm test`
6. `npm run build`
7. `SMOKE_SKIP_BUILD=1 SMOKE_PORT=3012 npm run smoke`
8. Stop the server.

## Release

1. The PO approves the **exact commit SHA**, based on screenshots of that SHA (desktop and phone; "nothing visible
   changes" where that is true). The Coordinator relays the approval.
2. The Editor merges the pull request on GitHub (a merge commit).
3. Vercel deploys `main` to production automatically. There is no separate promote step for this project.
4. The Editor checks production with `curl`. Browser checks run only through `scripts/prod-check.mjs`, which sets
   the internal-mode marker so checks are never counted.

## Scheduled articles

An approved article gets `publishAt` and goes live at **07:00 Europe/Berlin** on that day. The Editor's morning check
at **07:14** confirms it is live (with `curl`) and moves the card to PUBLISHED.

## After a restart (WSL or laptop)

1. Run `tmux ls` to see which sessions survived.
2. Start each missing agent:

   ```bash
   tmux new -d -s blog-editor  -c "$HOME/.a Projects/zauberlabs-web-editor"  'claude --continue --remote-control Editor -n Editor'
   tmux new -d -s blog-builder -c "$HOME/.a Projects/zauberlabs-web-builder" 'claude --continue --remote-control Builder -n Builder'
   tmux new -d -s blog-writer  -c "$HOME/.a Projects/zauberlabs-web-writer"  'claude --continue --remote-control Writer -n Writer'
   ```

3. Check in each session that its scheduled checks are still there (the morning checks); re-create any that are missing.
4. Remember that `/tmp` is cleared, including any scratch files and screenshots kept there.

## Standing rules

- **No personal data in outbound requests.** Never send personal data (e-mail addresses, names, tokens) in a
  User-Agent, header, URL or request body to an outside host. Outside fetches use a neutral User-Agent with no personal
  data.
- **No heavy jobs during an E46 gate.** No builds, test suites or screenshot servers while `/tmp/e46-gate.lock`
  exists, and none while the load is above about 6. Run one heavy job at a time and stop dev servers after use.
- **Change only what was asked.** A UI fix touches only the named element.
- **Screenshots for approval.** Every request for the PO's approval names the exact SHA and includes screenshots of
  it, or says "nothing visible changes".
- **Production is checked without being counted:** `curl`, or `scripts/prod-check.mjs` for browser checks.
