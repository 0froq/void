#!/usr/bin/env node
/**
 * LAUNCH_EDITOR entry. launch-editor does not shell-split LAUNCH_EDITOR,
 * and for an unrecognized binary it passes three argv:
 *   launch.mjs <absolute-file> <line> <column>
 * A recognized editor such as `zed` instead receives one `file:line:col` arg.
 * This script accepts both and forwards them to the dev server.
 *
 *   LAUNCH_EDITOR=/abs/path/tools/mini-editor/launch.mjs
 */
import process from 'node:process'

async function main() {
  const port = process.env.MINI_EDITOR_PORT || process.env.PORT || '3000'
  const args = process.argv.slice(2)
  const file = args[0]
  if (!file) {
    console.error('mini-editor: expected <file> <line> <column>')
    process.exit(1)
  }

  const spec = args.length >= 2 && /^\d+$/.test(args[1])
    ? `${file}:${args[1]}:${args[2] || '1'}`
    : file

  const response = await fetch(`http://localhost:${port}/__mini-editor/open`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ file: spec }),
  })

  if (!response.ok) {
    const text = await response.text()
    console.error(text || `mini-editor: open failed (${response.status})`)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
