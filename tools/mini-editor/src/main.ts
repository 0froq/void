import type { Extension } from '@codemirror/state'
import { indentWithTab } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { markdown } from '@codemirror/lang-markdown'
import { vue } from '@codemirror/lang-vue'
import { EditorSelection } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'

interface OpenTarget {
  path?: string
  file?: string
  relative?: string
  line: number
  column: number
  text?: string
}

const nameEl = document.querySelector('#name')
const stateEl = document.querySelector('#state')
const posEl = document.querySelector('#pos')
const hintEl = document.querySelector('#hint')
const parent = document.querySelector('#editor')

if (!(nameEl instanceof HTMLElement) || !(stateEl instanceof HTMLElement) || !(posEl instanceof HTMLElement) || !(hintEl instanceof HTMLElement) || !(parent instanceof HTMLElement))
  throw new Error('mini-editor: missing shell')

const mod = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'
hintEl.textContent = `${mod}S save · ${mod}W close`

let saved = ''
let current = ''
let view: EditorView | null = null

const params = new URLSearchParams(location.search)
const initial: OpenTarget = {
  path: params.get('path') || '',
  line: numberParam(params.get('line'), 1),
  column: numberParam(params.get('col'), 1),
}

void load(initial)

const events = new EventSource('/__mini-editor/events')
events.onmessage = (event) => {
  const data = JSON.parse(event.data) as OpenTarget
  if (data.path === current && view)
    place(view, data.line, data.column)
  else
    void load(data)
}

window.addEventListener('pagehide', () => {
  navigator.sendBeacon('/__mini-editor/bye')
})

async function load(target: OpenTarget): Promise<void> {
  if (!target.path) {
    stateEl.textContent = 'No file'
    return
  }
  const response = await fetch(`/__mini-editor/file?path=${encodeURIComponent(target.path)}`)
  if (!response.ok) {
    stateEl.textContent = 'Cannot open'
    nameEl.textContent = target.path
    return
  }
  const body = await response.json() as OpenTarget & { text: string, relative: string }
  current = body.path || body.file || ''
  saved = body.text
  document.title = body.relative
  nameEl.textContent = body.relative
  mount(body.text, target.line || body.line, target.column || body.column)
  markDirty(false)
}

function mount(text: string, line: number, column: number): void {
  const extensions: Extension[] = [
    basicSetup,
    languageOf(current),
    EditorView.theme({
      '&': { height: '100%', fontSize: '13px' },
      '.cm-scroller': { fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace' },
      '.cm-content': { padding: '8px 0' },
    }),
    EditorView.updateListener.of((update) => {
      if (update.docChanged)
        markDirty(update.state.doc.toString() !== saved)
      if (update.selectionSet || update.docChanged)
        showCursor(update.view)
    }),
    keymap.of([
      indentWithTab,
      {
        key: 'Mod-s',
        run: () => {
          void save()
          return true
        },
      },
      { key: 'Mod-w', run: closeWindow },
    ]),
  ]
  if (current.endsWith('.md') || current.endsWith('.mdc'))
    extensions.push(EditorView.lineWrapping)

  view?.destroy()
  view = new EditorView({ doc: text, extensions, parent })
  place(view, line, column)
}

function place(editor: EditorView, line: number, column: number): void {
  const doc = editor.state.doc
  const lineNo = Math.min(Math.max(1, line), doc.lines)
  const row = doc.line(lineNo)
  const pos = Math.min(row.to, row.from + Math.max(0, column - 1))
  editor.dispatch({
    selection: EditorSelection.cursor(pos),
    scrollIntoView: true,
  })
  editor.focus()
  showCursor(editor)
}

async function save(): Promise<void> {
  if (!view || !current)
    return
  const text = view.state.doc.toString()
  const response = await fetch('/__mini-editor/file', {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ path: current, text }),
  })
  if (!response.ok) {
    stateEl.textContent = 'Save failed'
    return
  }
  saved = text
  markDirty(false)
  stateEl.textContent = 'Saved'
  window.setTimeout(() => {
    if (stateEl.textContent === 'Saved')
      markDirty(false)
  }, 1200)
}

function closeWindow(): boolean {
  navigator.sendBeacon('/__mini-editor/bye')
  window.close()
  return true
}

function markDirty(dirty: boolean): void {
  stateEl.dataset.dirty = dirty ? 'true' : 'false'
  stateEl.textContent = dirty ? 'Edited' : ''
}

function showCursor(editor: EditorView): void {
  const cursor = editor.state.selection.main.head
  const row = editor.state.doc.lineAt(cursor)
  posEl.textContent = `Ln ${row.number}, Col ${cursor - row.from + 1}`
}

function languageOf(file: string): Extension {
  const ext = file.split('.').pop()?.toLowerCase() ?? ''
  switch (ext) {
    case 'vue':
      return vue()
    case 'ts':
    case 'tsx':
    case 'mts':
    case 'cts':
      return javascript({ typescript: true, jsx: ext === 'tsx' })
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return javascript({ jsx: ext === 'jsx' })
    case 'css':
    case 'scss':
    case 'less':
      return css()
    case 'md':
    case 'mdc':
      return markdown()
    default:
      return []
  }
}

function numberParam(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
