import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'OpenDataLayer',
  description: 'Universal, open-source data layer protocol',
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Spec', link: '/spec/' },
      { text: 'Reference', link: '/reference/events' },
      { text: 'GitHub', link: 'https://github.com/DataLayerProtocol/OpenDataLayer' },
    ],
    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Getting Started', link: '/guide/getting-started' },
          { text: 'Core Concepts', link: '/guide/core-concepts' },
          { text: 'SDK Usage', link: '/guide/sdk-usage' },
          { text: 'Validation', link: '/guide/validation' },
          { text: 'Adapters', link: '/guide/adapters' },
        ],
      },
      {
        text: 'Reference',
        items: [
          { text: 'Events', link: '/reference/events' },
          { text: 'Contexts', link: '/reference/contexts' },
        ],
      },
    ],
  },
});
