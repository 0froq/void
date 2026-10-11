# @froq/ui

froq 自己项目用的 UI 库。共用的逻辑和 token 契约在 `core`、`vue`，组件在 `src/components`。

```
src/
  core/         纯 TS,不依赖任何框架:token 契约、键盘导航、笔画几何、减弱动效判断
  vue/          无样式的 Vue 行为层(useChoice、useClipboard 等)
  components/   一个目录一个概念，例如 radio/、toggle/
  index.ts      从 @froq/ui 导出的组件
  style.css
  tokens.css
docs/           文档站(Nuxt Content)。workspace 依赖本库,改组件和改文档在同一次提交里
```

## 组件

**AI Draft · 待人工设计验证。** 当前所有组件均为 AI 生成的初稿，尚未经维护者手动设计或视觉验收。已有实现不等于设计定稿；组件旁的中英文说明以 `designStatus: ai-draft` 记录此状态，文档站统一展示标记。暂时接受当前实现不解除此标记。

都从 `@froq/ui` 导出:

| 组件 | 说明 |
| --- | --- |
| Button / CopyButton | 原生按钮、异步剪贴板与稳定宽度反馈 |
| TextInput / TextArea / Select / Checkbox | 原生表单控件；native attributes/events 传到实际控件 |
| FormField / NumberInput / DateInput / Slider / FileUpload / RadioGroup | 标签与错误关联、原生数值/日期/范围/文件/单选；业务校验与重置由调用方负责 |
| Choice / ChoiceCircle / Toggle | 受控选择与开关；支持禁用；自定义 radio 不自动提交表单值 |
| ToggleGroup | 单选或多选二态按钮组；方向键只移动焦点，允许取消已选值 |
| Combobox | 搜索选择与多选；选中值、输入文本、展开状态独立，远程请求由调用方处理 |
| Calendar / DatePicker | 共用单月日历的内联选择与弹层选择；ISO 日期字符串、语言格式、范围及禁选日期 |
| Navigation / Sidebar | 扁平链接、多级可折叠导航；调用方负责路由 |
| Breadcrumb / Pagination | 有序路径、受控页码与真实分页链接；不生成路由或请求数据 |
| Collapsible / Accordion / Tabs | 受控展开与标签面板；保持面板内容挂载 |
| Skeleton / Progress / Spinner / Alert | 区域加载态、进度、等待和行内提示 |
| Banner | 站点级活动、公告与 WIP 通知；操作插槽与使用方管理的关闭 |
| Toast / ToastRegion | 受控临时通知、共享呈现区域与可清理暂停计时；消息队列留在调用方 |
| IconButton / EmptyState | 命名图标按钮、空内容与操作插槽 |
| Badge / Avatar / Separator / Card / AspectRatio / Table | 内容标记、图片占位、分隔、表面、媒体比例与原生表格 |
| Dialog / AlertDialog / Drawer / Popover / DropdownMenu / Tooltip | 弹窗、确认、侧边面板、锚定浮层、嵌套命令菜单与文字提示 |
| ContextMenu / HoverCard | 焦点/右键命令菜单与链接补充预览；预览不承载必需信息或操作 |
| Paper | 纸张纹理皮肤 |

每个组件旁有 demo 和中英文 API 说明，文档站自动从源码发现，不维护第二份名单。已实现项目与后续范围见 [覆盖记录](./docs/component-roadmap.md)；可导出不代表已完成手动视觉验收。

## Token 契约

`tokens.css` 在作用域类 `.ui` 上定义下面这些变量,组件只读它们,不读别的:

`--ui-bg` `--ui-fg` `--ui-muted` `--ui-faint` `--ui-line` `--ui-accent` `--ui-font-display` `--ui-font-text` `--ui-font-meta` `--ui-ease` `--ui-dur` `--ui-radius`

- 颜色用 `light-dark()`,跟随系统;在自己或祖先元素上写 `data-theme="light|dark"` 可以强制。
- 作用域是一个类,不是全局。把 `class="ui"` 放在页面里的一块区域上,那一块就用这些变量。
- 只想要 token、不用 Vue 组件的项目,单独引 `@froq/ui/tokens.css` 就行。
- `pnpm check:tokens` 检查所有变量都有定义，以及组件样式没有读取契约外的变量。

## 使用

```ts
import '@froq/ui/style.css'
import { Choice, Toggle } from '@froq/ui'
```

```vue
<div class="ui">
  <Choice v-model="tone" label="Tone" :options="[{ value: 'quiet', label: 'quiet' }, { value: 'loud', label: 'loud' }]" />
</div>
```

字体不打包在库里。组件用 Instrument Serif、Geist、Geist Mono,项目自己引(比如 `@fontsource*`),没引就退回系统字体。

Skeleton 只管理显式的 `loading`，不等待字体、路由或请求。用默认插槽保留已知区域的布局；未知内容由调用方用 `width` / `height` 预留尺寸。不要为了静态内容刷新而套加载框。

Toast 在共享的 ToastRegion 里使用。消息队列、ID、请求结果和重要信息的持久展示留在调用方；Toast 不是限时确认框。无样式行为 `useAutoDismiss(active, { duration, paused?, onDismiss })` 从 `@froq/ui/vue` 导出，在组件 setup 中调用：挂载后开始计时，暂停保留余时，重新激活或修改 duration 重置，关闭/卸载清理；非有限或不大于零的时长不自动关闭。

Calendar / DatePicker 使用公历 `YYYY-MM-DD` 或空字符串，不把日期转换成当地时区的时间戳。`locale` 和空值时的 `initialDate` 由调用方提供；`today` 标记也是显式传入，以保持 SSR 一致。基础日期函数 `parseCalendarDate`、`calendarDateBounds`、`formatCalendarDate` 从 `@froq/ui/core` 导出。DatePicker 是日历按钮，不承诺原生表单必填校验；需要原生输入、必填和日期范围校验时使用 DateInput。

弹层组件依赖 `reka-ui`，使用方安装 file 依赖时由包管理器一并安装。默认 portal 目标是最近的 `.ui`，以保留主题与 token。指定 `portal-to` 时目标必须存在并由使用方提供同样的主题作用域；不要直接移到未配置 token 的 body。变换或裁剪该作用域可能影响 fixed 弹层，必要时指定独立的已配置作用域。

Dialog / Drawer 默认有内置触发器；外部列表条目控制打开时，设 `:show-trigger="false"`，并把实际开启按钮的 DOM 元素传给 `return-focus`。关闭后优先返回该可用元素，否则尝试打开时捕获的焦点；开启者已移除时，由调用方通过可取消的 `closeAutoFocus` 事件选择后备位置。`disabled` 不会替调用方禁用外部按钮。无样式 `useFocusReturn(open, target, captureFallback)` 从 `@froq/ui/vue` 导出，绑定层的可取消 open/close autofocus 事件；它不实现焦点陷阱。代表性组合源码在 [ConsumerAdapters.vue](docs/examples/ConsumerAdapters.vue)，不是已迁移的外部项目或 UI 验收结果。

ContextMenu 通过组件 ref 暴露 `close()`，消费端可据此实现滚动或路由切换时关闭。禁用或关闭不会重挂载目标插槽；已排队的过期打开请求被拦截，但不声称取消了 Reka 内部计时器。无样式 `useContextMenuControl(disabled)` 从 `@froq/ui/vue` 导出，只能在 Reka ContextMenuRoot 后代中调用；返回 `close` 与供触发器 capture 事件使用的 `prepare`。菜单仍是内部状态，没有受控 `open` 或 `v-model`。

根包的运行时依赖必须写普通版本范围，不能用本 workspace 的 `catalog:`：外部项目通过 `file:vendor/ui` 安装时无法解析库的 catalog。开发工具仍使用具名 catalog。

包里发的是源码(`.vue`、`.ts`、`.css`),由使用方的构建工具编译。Vite 项目直接可用;Nuxt 需要:

```ts
export default defineNuxtConfig({
  build: { transpile: ['@froq/ui'] },
  css: ['@froq/ui/style.css'],
})
```

## 放进别的项目

别的项目自己带一份源码，放在 `vendor/ui`，并提交在那个项目里。本地 dev 和远端构建都编译项目提交里的这一份。给 agent 的步骤写在 [`AGENTS.md`](./AGENTS.md)。安装时还要把「推送到上游」「拉取上游」和「把项目里的组件抽进库」写进该项目自己的 agent markdown。

## 加一个组件

先在 `src/vue/` 里写行为(不管样子),再在 `src/components/<concept>/<Name>.vue` 里写组件,并从 `src/index.ts` 导出。旁边加 `<Name>.demo.vue`、`<Name>.md` 和 `<Name>.zh.md`。概念页在 `/components/<concept>`，放这个目录里的 demo。组件页在 `/components/<concept>/<name>`，渲染旁边的说明。左侧目录里分组标题不是页面，概念和组件是页面。

## 命令

```bash
pnpm dev            # 文档站 http://localhost:3000
pnpm generate       # 静态导出到仓库根的 dist/,和 Cloudflare Pages 的输出目录一致
pnpm check          # lint + 类型检查 + token 契约检查
```

## 文档站

https://ui-a09.pages.dev

`docs/` 用 Nuxt Content。部署方式和 paper-landing 一样:Cloudflare Pages 连接这个 GitHub 仓库,生产分支 `main`,构建命令 `pnpm generate`,输出目录 `dist`,环境变量 `NODE_VERSION=22`。

`nuxt generate` 在 Cloudflare 上会因为 `CF_PAGES=1` 把静态文件写到 `dist/`。文档站把 Nitro preset 固定成 `cloudflare-pages-static`,并把输出目录指到仓库根的 `dist/`,这样本地和线上是同一个目录。

当前发布路径是纯静态文件，不是 Pages Functions：内容查询在客户端使用打包的 WASM SQLite 和 SQL dump。Nuxt Content 的 Cloudflare preset 仍可能打印 D1 提示，但不要因此给这份静态产物虚构数据库绑定；若改为服务端 `cloudflare-pages` 部署，才需要按官方步骤配置 D1。参见 [Nuxt Content 静态部署](https://content.nuxt.com/docs/deploy/static) 与 [Pages 服务端部署](https://content.nuxt.com/docs/deploy/cloudflare-pages)。本地生成通过不等于已经部署或验收线上页面。

当前交付证据及待验收项见 [发布审计](docs/release-audit.md)。CI 按提交中的锁文件安装；不要依赖构建时重新解析版本来掩盖不兼容。
