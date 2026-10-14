import type { Nuxt } from 'nuxt/schema'
import type { Plugin } from 'vite'
import process from 'node:process'
import { defineNuxtModule } from 'nuxt/kit'
import { createMiniEditor } from '../tools/mini-editor/server.mjs'

interface DevtoolsHost {
  openInEditorHooks?: Array<(input: string) => boolean | Promise<boolean>>
}

interface MiniEditorOptions {
  /** `zed` (default), `code` / `vscode`, `cursor`, or `subl` / `sublime`. */
  editor: string
  /** Window size after open, e.g. `900x600`. Env: `MINI_EDITOR_SIZE`. */
  size: string
  /** `right` (default), `center`, or `mouse`. Env: `MINI_EDITOR_POSITION`. */
  position: string
  /** Set `false` or `MINI_EDITOR_PLACE=0` to skip window placement. */
  place: boolean
}

/**
 * Dev-only. The inspector and `/__open-in-editor` open the configured
 * editor in a new window at file:line:col. Outside `nuxt dev` this
 * module registers nothing.
 *
 * Editor: `miniEditor.editor` in nuxt.config, otherwise `MINI_EDITOR`, otherwise `zed`.
 */
export default defineNuxtModule<MiniEditorOptions>({
  meta: {
    name: 'mini-editor',
    configKey: 'miniEditor',
  },
  defaults: {
    editor: '',
    size: '',
    position: '',
    place: true,
  },
  setup(options, nuxt) {
    if (!nuxt.options.dev)
      return

    const editor = options.editor || process.env.MINI_EDITOR || 'zed'
    const session = createMiniEditor(nuxt.options.rootDir, {
      editor,
      size: options.size,
      position: options.position,
      place: options.place,
    })
    let hooked = false

    const installHook = () => {
      const hooks = devtoolsOf(nuxt)?.openInEditorHooks
      if (!hooks || hooked)
        return
      hooked = true
      session.markDevtoolsHook()
      hooks.push(input => session.open(input))
    }

    nuxt.hook('modules:done', installHook)
    nuxt.hook('devtools:initialized', installHook)
    nuxt.hook('ready', installHook)

    nuxt.hook('vite:extendConfig', (config, { isClient }) => {
      if (!isClient)
        return
      const plugins = config.plugins ||= []
      if (plugins.some(plugin => plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'void:mini-editor'))
        return
      plugins.unshift(editorPlugin(session))
    })
  },
})

function editorPlugin(session: ReturnType<typeof createMiniEditor>): Plugin {
  return {
    name: 'void:mini-editor',
    enforce: 'pre',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(session.middleware)
    },
  }
}

function devtoolsOf(nuxt: Nuxt): DevtoolsHost | undefined {
  return (nuxt as Nuxt & { devtools?: DevtoolsHost }).devtools
}
