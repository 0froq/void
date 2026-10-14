import type { Nuxt } from 'nuxt/schema'
import type { Plugin, ViteDevServer } from 'vite'
import { defineNuxtModule } from 'nuxt/kit'
import { createMiniEditor } from '../tools/mini-editor/server.mjs'

interface DevtoolsHost {
  openInEditorHooks?: Array<(input: string) => boolean | Promise<boolean>>
}

/**
 * Dev-only stand-in for Zed when the inspector asks to open a file.
 * Outside `nuxt dev` this module registers nothing, so the production
 * client and the Nitro build do not include the editor.
 */
export default defineNuxtModule({
  meta: { name: 'mini-editor' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev)
      return

    const session = createMiniEditor(nuxt.options.rootDir)
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
      session.attach(server as ViteDevServer)
      server.middlewares.use(session.middleware)
    },
  }
}

function devtoolsOf(nuxt: Nuxt): DevtoolsHost | undefined {
  return (nuxt as Nuxt & { devtools?: DevtoolsHost }).devtools
}
