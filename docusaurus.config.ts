import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Cajun',
  tagline: 'Concurrency And Java UNlocked - A lightweight actor framework for Java',
  favicon: 'img/favicon.ico',

  // Set the production url of your site here
  url: 'https://cajunsystems.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/',

  // GitHub pages deployment config.
  organizationName: 'CajunSystems',
  projectName: 'cajunsystems.github.io',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/CajunSystems/cajun/tree/feat/idiomatic-java-style/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themes: ['@docusaurus/theme-mermaid'],
  markdown: {
    mermaid: true,
  },

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Cajun',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://github.com/CajunSystems/cajun',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Core Concepts',
              to: '/docs/getting-started/core-concepts',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'GitHub',
              href: 'https://github.com/CajunSystems/cajun',
            },
            {
              label: 'Issues',
              href: 'https://github.com/CajunSystems/cajun/issues',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Benchmarks',
              to: '/docs/performance/benchmarks',
            },
            {
              label: 'Maven Central',
              href: 'https://central.sonatype.com/artifact/com.cajunsystems/cajun',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} CajunSystems. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['java', 'gradle'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
