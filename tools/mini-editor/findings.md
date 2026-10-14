# Mini editor

Replaces the in-page markdown desk. The inspector's "open in editor" opens a small window on the file it already resolved. Any text file under the project root. Dev only.

## Recommendation

Use both of these, and do not rely on `LAUNCH_EDITOR` alone:

1. `nuxt.devtools.openInEditorHooks` for the Nuxt DevTools inspect panel.
2. A Vite `configureServer` middleware in front of `/__open-in-editor` for the Vite error overlay and vite-plugin-inspect.

The window is option (d): Chrome/Chromium `--app=` pointed at a page the dev server already serves. CodeMirror 6 is a devDependency. No Tauri or Electron binary.

`LAUNCH_EDITOR=tools/mini-editor/launch.mjs` still works. It is the fallback, not the hook `pnpm dev` uses.

## 1. How `file:line:col` arrives

Installed pieces, this repo: Vite 8.3.4, `launch-editor` 2.14.x, `@nuxt/devtools` 3.4.2, `vite-plugin-vue-tracer` 1.5.0.

### DevTools inspect panel (the click froQ means)

`NuxtDevtoolsInspectPanel` builds one string and emits it:

```js
const file = `${matched.pos[0]}:${matched.pos[1]}:${matched.pos[2]}`
```

`pos[0]` is the path vue-tracer recorded (workspace-relative). The view client calls `rpc.openInEditor(token, file)`.

The server RPC in `@nuxt/devtools` `module-main.mjs`:

```text
const FILE_LINE_COL_RE = /^(.*?)(:[:\d]*)$/
// input = "/abs/or/relative/App.vue:10:4"
// match[1] = path, match[2] = ":10:4"
// then, before launch-editor:
for (const hook of openInEditorHooks) {
  if (await hook(path + suffix)) return true
}
let editor = getOptions()?.behavior.openInEditor
if (editor === 'auto') editor = undefined
await launch(path + suffix, editor) // specified editor wins over LAUNCH_EDITOR
```

`openInEditorHooks` is `nuxt.devtools.openInEditorHooks`. A hook that returns `true` skips Zed. That is the hook this module pushes. `/__mini-editor/status` reported `devtoolsHook: true` while `pnpm dev` was running.

### Vite `/__open-in-editor`

Vite 8 registers `launch-editor-middleware` at `/__open-in-editor` after `configureServer`. Callers:

- Vite error overlay: `fetch(\`__open-in-editor?file=${encodeURIComponent(file)}\`)`where`file`is already`path:line:column`.
- vite-plugin-inspect: `file=${encodeURI(filepath)}:${line}:${column}`.

The middleware does `path.resolve(cwd, file)` and then `launch()`, which strips the trailing position with `/:(\d+)(?::(\d+))?$/`.

Our plugin is `enforce: 'pre'`, so its middleware runs first and answers the route. `launch-editor` is not called. Same parser, same `session.open()`.

Checked: `GET /__open-in-editor?file=/workspace/app/app.vue:10:4` returned

```json
{ "path": "/workspace/app/app.vue", "line": 10, "column": 4, "spawned": true }
```

`../../etc/passwd:1:1` returned 404 `reason: "outside"`. `node_modules` and `.env*` are refused the same way. A symlink that resolves outside the project root is refused.

### `LAUNCH_EDITOR`

`guess.js` does **not** shell-split `process.env.LAUNCH_EDITOR`. The value must be one executable (`tools/mini-editor/launch.mjs` with a node shebang), not `node tools/mini-editor/launch.mjs`.

`get-args.js` then special-cases known basenames. `zed` and `subl` get a single `file:line:col` argument. An unrecognized `LAUNCH_EDITOR` gets three arguments: absolute file, line, column. `launch.mjs` accepts both shapes and POSTs `/__mini-editor/open`.

Ran `launch.mjs /workspace/app/app.vue 12 2` against the dev server. Exit 0. The already-open window moved to `app/app.vue` Ln 12, Col 2. It did not start a second Chrome.

`LAUNCH_EDITOR` loses when DevTools settings name an editor (`behavior.openInEditor` is passed as `specifiedEditor`, and that branch runs before the env var). The hook above still runs first.

### vue-tracer and the other RPC

With `viteDevtools: true`, tracer's click calls `rpc vite:core:open-in-editor` with `` `${file}:${line}:${col}` ``. Nuxt's setup is `VueTracer()` without that flag. The inspect panel path above is the one this app uses. That RPC name is not implemented anywhere else in this install.

## 2. Window options

|                     | Startup                                                                                                                                             | Size                                                                     | What you take on                                                                                                                                                                                                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| (d) Chrome `--app=` | Process already there after the first launch. HTTP open was 34ms; the page HTML was 3ms. First window on this VM was up and titled within about 2s. | One browser profile under `$TMPDIR/void-mini-editor-chrome`. No compile. | Chrome or Chromium. A separate `--user-data-dir` so it does not reuse the daily profile.                                                                                                                                                                          |
| (a) Tauri           | Cold `cargo` build, then a small process. Single-instance + CLI args are a plugin.                                                                  | Rust toolchain, WebView, macOS bundle.                                   | Real native window. Not built here.                                                                                                                                                                                                                               |
| (b) Electron        | Similar to Tauri, larger runtime, no Rust.                                                                                                          | Electron download and a pack step.                                       | Same window job as Tauri. Not built.                                                                                                                                                                                                                              |
| (c) Existing editor | Whatever is already installed.                                                                                                                      | Zero.                                                                    | Not our UI. `zed file:line:col` is what launch-editor already does for basename `zed`. `subl` gets the same one-arg form. CotEditor and `micro` are not in launch-editor's switch, so they only get the filename unless `LAUNCH_EDITOR` is set (then three args). |

(d) is the one that runs on this Linux VM and on a Mac without a native build. Tauri is the follow-up if the window has to not be Chrome. Arc is untested: the launcher tries Chrome, Chromium, Edge, Brave, then Arc, in that order, and passes `--app=`.

Repeated opens reuse the window. The page holds an SSE connection. A later open broadcasts `{ path, line, column }` instead of spawning. Verified: the second open returned `reused: true`, and `launch.mjs` moved the cursor in that same window.

## 3. What is in the tree

- `modules/mini-editor.ts` returns immediately unless `nuxt.options.dev`. The Vite plugin is `apply: 'serve'`.
- `tools/mini-editor/server.mjs` is the middleware, the path check, and the Chrome spawn.
- `tools/mini-editor/src/main.ts` is CodeMirror 6 (`vue`, `javascript`/`typescript`, `css`, `markdown`).
- `Mod-s` saves. `Mod-w` calls `window.close()`. Chrome app mode also binds the close shortcut itself.
- Writes go through `resolveProjectFile` again. The client cannot choose a path outside the project.

CodeMirror is a **devDependency**. Nothing under `app/` imports it.

## 4. Verified on this Linux VM

`pnpm dev` (Nuxt 4.6.1), Chrome `--app` on `DISPLAY=:1`.

- Inspect hook registered.
- `/__open-in-editor?file=/workspace/app/app.vue:10:4` opened the window on that line and column. Vue highlighting rendered.
- Path traversal refused.
- Second open reused the window.
- Ctrl+S on a scratch `.vue` wrote `world` into the file. The status line said Saved. Scratch file deleted afterward. `app/app.vue` and `SiteHeader.vue` were restored; `git diff` is clean for them.
- CSS, TS, and `content/zh/notes/shipping-void.md` (Ln 7) opened in the same window.
- `launch.mjs <file> <line> <column>` focused Ln 12, Col 2.
- Ctrl+W closed the Chrome app window. `/__mini-editor/status` then showed `clients: 0`.
- Vite HMR, from a `vite-hmr` socket on `ws://localhost:3000/_nuxt/?token=…`:
  - Saving `app/components/SiteHeader.vue` produced `update js-update:/components/SiteHeader.vue`. No `full-reload`.
  - Saving `app/app.vue` produced `full-reload` and `update /app.vue`. The root file is the one Vite refreshes harder. The dev server did not restart.

## 5. Needs a check on froQ's Mac

- Cmd+S and Cmd+W. CodeMirror uses `Mod`, so those are Cmd on macOS. Ctrl+S and Ctrl+W worked here. Cmd itself was not pressed.
- The inspect panel mouse click. The hook is installed and calls the same `open()` the HTTP route calls. The click was not done.
- Chrome `--app` on macOS (title bar, Spaces, focus). Arc `--app` specifically.
- Whether the first-launch Chrome profile prompt appears. Flags are `--no-first-run --no-default-browser-check --disable-extensions`.
- `nuxt build` / `nuxt generate` was not re-run in this pass. The module adds no plugin when `dev` is false. Deploy config (`nitro.preset: static`, `cf deploy`) was not touched.

## Effort to take further

Stay on (d) if Chrome is acceptable: the remaining work is the Mac pass above, plus whatever editor features the full editor needs (this window already edits vue/ts/css/md, not a markdown desk).

Move to Tauri only for a non-browser window: one crate, `tauri-plugin-single-instance` or a CLI `mini-editor file line col`, the same CodeMirror page in the webview, and a macOS build. The dev-server hook does not change; it would spawn that binary instead of Chrome. Electron is the same shape with a heavier runtime and no advantage here.
