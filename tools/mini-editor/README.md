# Mini editor (dev only)

Hooks Nuxt DevTools and Vite `/__open-in-editor` so the inspector opens your editor in a **new window** at `file:line:col`. After spawn, `placeWindow()` resizes and moves that window when the platform adapter can.

## Configure the editor

| Source                            | Key           | Default |
| --------------------------------- | ------------- | ------- |
| `nuxt.config` `miniEditor.editor` |               | `zed`   |
| env                               | `MINI_EDITOR` |         |

| `MINI_EDITOR`     | Spawn command                |
| ----------------- | ---------------------------- |
| `zed`             | `zed --new file:line:col`    |
| `code`, `vscode`  | `code -n -g file:line:col`   |
| `cursor`          | `cursor -n -g file:line:col` |
| `subl`, `sublime` | `subl -n file:line:col`      |

## Window placement

| Source                              | Key                        | Default      |
| ----------------------------------- | -------------------------- | ------------ |
| `nuxt.config` `miniEditor.size`     |                            | `900x600`    |
| env                                 | `MINI_EDITOR_SIZE`         |              |
| `nuxt.config` `miniEditor.position` | `right`, `center`, `mouse` | `right`      |
| env                                 | `MINI_EDITOR_POSITION`     |              |
| `miniEditor.place: false` or env    | `MINI_EDITOR_PLACE=0`      | placement on |

`right` puts the window on the main screen with a right margin, vertically centered. `center` centers on the main display. `mouse` anchors near the pointer (Linux uses `xdotool` for coordinates when available).

Placement never blocks open-in-editor. Missing tools or permission errors log one hint and leave the editor window as the app opened it.

### macOS

Adapter: `osascript` + System Events (process names: Zed, Code, Cursor, Sublime Text).

Grant **Accessibility** to the app that runs `pnpm dev` (Terminal, iTerm, Cursor, etc.). If placement fails, the dev server logs:

`[mini-editor] Could not resize the editor window. On macOS, grant Accessibility...`

### Linux (X11)

Adapter: `wmctrl` if present, else `xdotool`. Window class hints: `zed.Zed`, `code.Code`, `cursor.Cursor`, `sublime_text.sublime_text`.

Install at least one of `wmctrl` or `xdotool` on X11.

### Linux (Wayland)

When `WAYLAND_DISPLAY` is set: `hyprctl` (Hyprland) or `swaymsg` (Sway). Otherwise one hint and skip. Position math may still call `xdotool getdisplaygeometry` / `getmouselocation` when installed.

### Windows

No-op adapter (spawn only).

## Optional `LAUNCH_EDITOR`

`tools/mini-editor/launch.mjs` POSTs to `/__mini-editor/open`. Normal `pnpm dev` uses the hook directly.

## Tests

```bash
node --test tools/mini-editor/*.test.mjs
```

More detail: `findings.md`.
