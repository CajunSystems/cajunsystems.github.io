import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/installation',
        'getting-started/core-concepts',
      ],
    },
    {
      type: 'category',
      label: 'Core Features',
      items: [
        'core-features/actor-id-strategies',
        'core-features/mailbox-guide',
        'core-features/backpressure',
        'core-features/persistence-guide',
      ],
    },
    {
      type: 'category',
      label: 'Effect Monad',
      items: [
        'effect-monad/guide',
        'effect-monad/api',
        'effect-monad/throwable-effect',
      ],
    },
    {
      type: 'category',
      label: 'Advanced Topics',
      items: [
        'advanced/reply-pattern',
        'advanced/sender-propagation',
        'advanced/batching-optimization',
        'advanced/supervision',
      ],
    },
    {
      type: 'category',
      label: 'Clustering',
      items: [
        'clustering/cluster-mode',
      ],
    },
    {
      type: 'category',
      label: 'Performance',
      items: [
        'performance/benchmarks',
      ],
    },
  ],
};

export default sidebars;
