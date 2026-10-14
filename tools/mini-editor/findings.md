# Mini editor

The inspector's "open in editor" opens froQ's own editor in a **new window** at `file:line:col`. Cmd+W closes that window. The Chrome `--app` page and CodeMirror are gone.

## Recommendation

Keep the same two hooks, and spawn the editor from them:

1. `nuxt.devtools.openInEditorHooks` for the Nuxt DevTools inspect panel.
2. A Vite `configureServer` middleware in front of `/__open-in-editor` for the Vite error overlay and vite-plugin-inspect.

Default command, from the current Zed CLI (`zed --help` / `crates/cli`):

```sh
zed --new /absolute/path/app.vue:10:4
```

`-n` is the same flag. `--new` creates a new workspace even when the file is already open. The position suffix is `path:line:column`, 1-based, which is what the CLI documents.

`launch-editor` (what DevTools calls when no hook returns true) does **not** pass `--new`. For basename `zed` it runs `zed file:line:col`, and Zed's current default is to reuse a window. That is why this module spawns the process itself and returns true.

Choose the editor with `MINI_EDITOR` or `miniEditor.editor`. An explicit nuxt.config value wins, then the env var, then `zed`.

| Value             | Command                      | New window                             |
| ----------------- | ---------------------------- | -------------------------------------- |
| `zed` (default)   | `zed --new file:line:col`    | `--new` / `-n`                         |
| `code`, `vscode`  | `code -n -g file:line:col`   | `-n` / `--new-window`, `-g` / `--goto` |
| `cursor`          | `cursor -n -g file:line:col` | same flags as VS Code                  |
| `subl`, `sublime` | `subl -n file:line:col`      | `-n` / `--new-window`                  |

`MINI_EDITOR` may also be an absolute path whose filename is one of those (`/usr/local/bin/zed`). Anything else returns false from the hook, and DevTools falls through to `launch-editor` (no `--new`).

A binary that is not on `PATH` also returns false, for the same reason. This VM has no `zed`, `code`, `cursor`, or `subl`.

## Window placement

Editor CLIs still have no geometry flags. After spawn, `placeWindow({ editor, width, height, position })` picks a platform adapter:

- **macOS:** `osascript` + System Events (Zed, Code, Cursor, Sublime Text). Retries until the process window exists. Needs Accessibility on the terminal running `pnpm dev`.
- **Linux X11:** `wmctrl`, else `xdotool`, matched by window class.
- **Linux Wayland** (`WAYLAND_DISPLAY`): `hyprctl` or `swaymsg` when present; otherwise one hint and skip.
- **Windows:** no-op.

Defaults: `900x600`, position `right` (main screen, right margin, vertically centered). Configure with `miniEditor.size` / `MINI_EDITOR_SIZE`, `miniEditor.position` / `MINI_EDITOR_POSITION` (`right`, `center`, `mouse`), or `MINI_EDITOR_PLACE=0` to disable. Failures log once and never block open-in-editor. See `tools/mini-editor/README.md`.

## How `file:line:col` arrives

Installed pieces: Vite 8.3.4, `launch-editor` 2.14.x, `@nuxt/devtools` 3.4.2.

The inspect panel builds one string, `` `${pos[0]}:${pos[1]}:${pos[2]}` ``, and the view client calls `rpc.openInEditor`. The server walks `openInEditorHooks` **before** `launch()`. A hook that returns true skips the configured editor. This module pushes that hook. `pos[0]` is the workspace-relative path vue-tracer recorded.

Vite registers `launch-editor-middleware` at `/__open-in-editor` after `configureServer`. The error overlay fetches `file` already shaped as `path:line:column`. vite-plugin-inspect uses `filepath:line:column`. Our plugin is `enforce: 'pre'`, so it answers first with the same `session.open()`.

`LAUNCH_EDITOR` is not shell-split. `tools/mini-editor/launch.mjs` still accepts either one `file:line:col` argument or three arguments and POSTs `/__mini-editor/open`. `pnpm dev` does not need it. A named editor in DevTools settings beats `LAUNCH_EDITOR`, and it still loses to this hook.

## Path checks

`resolveProjectFile` runs before spawn. `..`, a symlink that leaves the project, `node_modules`, `.git`, and `.env*` are refused. The HTTP route then returns 404 and does not call `launch-editor`. The DevTools hook returns false for those paths, so the normal editor can still open them. The client never sends a path we write; the editor saves the file itself, and Vite HMR follows that write.

Every accepted open spawns again. There is no SSE reuse. Two clicks are two windows.

## Verified on this Linux VM

`node --test tools/mini-editor/*.test.mjs`.

- `zed` argv is `['zed', '--new', '/path/app.vue:10:4']`. Placement defaults in `/__mini-editor/status`.
- `code` / `vscode` argv is `['code', '-n', '-g', spec]`. `cursor` is the same with bin `cursor`. `subl` / `sublime` is `['subl', '-n', spec]`.
- A fake `zed` on disk was spawned twice. The log was `--new` plus `App.vue:3:2`, then `--new` plus `App.vue:8:1`.
- `GET /__open-in-editor?file=app/App.vue:6:5` with `cursor` returned that argv, line 6, column 5, and did not call `next()`.
- `../../etc/passwd` and `.env` were refused. The fake editor was not started.
- A missing binary and `emacs` return false (`not-on-path`, `unknown-editor`).
- With `pnpm dev` and `MINI_EDITOR_NO_SPAWN=1`, `GET /__open-in-editor?file=/workspace/app/app.vue:10:4` returned the `zed --new` command, and `/__mini-editor/status` reported `devtoolsHook: true`.

No GUI editor is installed here, so a real window, Cmd+W, and HMR-from-that-window were not exercised. Saving a file from the editor is an ordinary disk write; the earlier pass already saw Vite `js-update` a component and `full-reload` root `app.vue`.

## Needs a check on froQ's Mac

- `zed` is the shell command from Zed's "Install CLI", not only the app bundle.
- Inspect-panel click opens a **new** Zed window on that line and column, and the main workspace stays put.
- Cmd+W closes that window. If it only closes the tab, that is Zed's close-last-item setting, not this hook. Same check for `code` / `cursor` (`window.closeWhenEmpty`) and Sublime.
- `MINI_EDITOR=cursor pnpm dev`, then `code` and `subl`, if those CLIs are installed.
- Save in the new window. The page updates through Vite. Root `app.vue` full-reloads; a component should not.
- After open, the new window resizes to `MINI_EDITOR_SIZE` (default `900x600`) and moves per `MINI_EDITOR_POSITION`. Grant Accessibility if placement does nothing.
- `nuxt build` was not re-run. The module returns before registering plugins when `dev` is false. Deploy config was not touched.
