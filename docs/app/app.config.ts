export default defineAppConfig({
  site: {
    nav: [
      { label: 'nav.docs', to: '/docs', external: false },
      { label: 'nav.components', to: '/components', external: false },
      { label: 'nav.changelog', to: '/changelog', external: false },
      { label: 'nav.github', to: 'https://github.com/0froq/ui', external: true },
    ],
    docs: [
      {
        label: 'docs.groups.start',
        items: ['/docs', '/docs/install'],
      },
      {
        label: 'docs.groups.contract',
        items: ['/docs/tokens'],
      },
    ],
  },
})
