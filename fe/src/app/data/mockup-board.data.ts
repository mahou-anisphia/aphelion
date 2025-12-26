import { BoardData } from '../models/project.model';

export const MOCKUP_BOARD_DATA: BoardData = {
  columns: [
    {
      id: 'active',
      title: 'Active',
      status: 'active',
      projects: [
        {
          id: '1',
          title: 'Stellar Guide',
          description: 'A collection of space-themed development tools and guides.',
          status: 'active',
          date: 'Dec 15, 2024',
          dateLabel: 'Started'
        },
        {
          id: '2',
          title: 'Cosmic CLI',
          description: 'Command-line tools for managing orbital projects.',
          status: 'active',
          date: 'Dec 10, 2024',
          dateLabel: 'Started'
        },
        {
          id: '3',
          title: 'Nebula Docs',
          description: 'Documentation generator with celestial theming.',
          status: 'active',
          date: 'Dec 5, 2024',
          dateLabel: 'Started'
        }
      ]
    },
    {
      id: 'paused',
      title: 'Paused',
      status: 'paused',
      projects: [
        {
          id: '4',
          title: 'Galaxy Builder',
          description: 'Procedural galaxy generation engine for simulations.',
          status: 'paused',
          date: 'Nov 20, 2024',
          dateLabel: 'Paused'
        },
        {
          id: '5',
          title: 'Orbit Tracker',
          description: 'Real-time satellite tracking application.',
          status: 'paused',
          date: 'Nov 12, 2024',
          dateLabel: 'Paused'
        }
      ]
    },
    {
      id: 'abandoned',
      title: 'Abandoned',
      status: 'abandoned',
      projects: [
        {
          id: '6',
          title: 'Void Chat',
          description: 'Anonymous messaging app with ephemeral messages.',
          status: 'abandoned',
          date: 'Oct 5, 2024',
          dateLabel: 'Abandoned'
        },
        {
          id: '7',
          title: 'Star Parser',
          description: 'Markdown parser with astronomical data support.',
          status: 'abandoned',
          date: 'Sep 22, 2024',
          dateLabel: 'Abandoned'
        },
        {
          id: '8',
          title: 'Comet Cache',
          description: 'High-speed caching library with TTL support.',
          status: 'abandoned',
          date: 'Aug 30, 2024',
          dateLabel: 'Abandoned'
        },
        {
          id: '9',
          title: 'Eclipse Theme',
          description: 'Dark theme pack for various IDEs and editors.',
          status: 'abandoned',
          date: 'Aug 15, 2024',
          dateLabel: 'Abandoned'
        }
      ]
    },
    {
      id: 'archived',
      title: 'Archived',
      status: 'archived',
      projects: [
        {
          id: '10',
          title: 'Supernova Deploy',
          description: 'Zero-config deployment tool for static sites.',
          status: 'archived',
          date: 'Jul 1, 2024',
          dateLabel: 'Archived'
        }
      ]
    }
  ]
};
