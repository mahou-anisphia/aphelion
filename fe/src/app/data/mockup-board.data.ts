import { BoardData } from '../models/project.model';

export const MOCKUP_BOARD_DATA: BoardData = {
  columns: [
    {
      id: 'active',
      title: 'Active',
      status: 'active',
      projects: [
        {
          id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
          title: 'Stellar Guide',
          description: 'A collection of space-themed development tools and guides.',
          status: 'active',
          date: 'Dec 15, 2024',
          dateLabel: 'Started',
          position: 0
        },
        {
          id: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
          title: 'Cosmic CLI',
          description: 'Command-line tools for managing orbital projects.',
          status: 'active',
          date: 'Dec 10, 2024',
          dateLabel: 'Started',
          position: 1
        },
        {
          id: 'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
          title: 'Nebula Docs',
          description: 'Documentation generator with celestial theming.',
          status: 'active',
          date: 'Dec 5, 2024',
          dateLabel: 'Started',
          position: 2
        }
      ]
    },
    {
      id: 'paused',
      title: 'Paused',
      status: 'paused',
      projects: [
        {
          id: 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
          title: 'Galaxy Builder',
          description: 'Procedural galaxy generation engine for simulations.',
          status: 'paused',
          date: 'Nov 20, 2024',
          dateLabel: 'Paused',
          position: 0
        },
        {
          id: 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
          title: 'Orbit Tracker',
          description: 'Real-time satellite tracking application.',
          status: 'paused',
          date: 'Nov 12, 2024',
          dateLabel: 'Paused',
          position: 1
        }
      ]
    },
    {
      id: 'abandoned',
      title: 'Abandoned',
      status: 'abandoned',
      projects: [
        {
          id: 'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
          title: 'Void Chat',
          description: 'Anonymous messaging app with ephemeral messages.',
          status: 'abandoned',
          date: 'Oct 5, 2024',
          dateLabel: 'Abandoned',
          position: 0
        },
        {
          id: 'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
          title: 'Star Parser',
          description: 'Markdown parser with astronomical data support.',
          status: 'abandoned',
          date: 'Sep 22, 2024',
          dateLabel: 'Abandoned',
          position: 1
        },
        {
          id: 'b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e',
          title: 'Comet Cache',
          description: 'High-speed caching library with TTL support.',
          status: 'abandoned',
          date: 'Aug 30, 2024',
          dateLabel: 'Abandoned',
          position: 2
        },
        {
          id: 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
          title: 'Eclipse Theme',
          description: 'Dark theme pack for various IDEs and editors.',
          status: 'abandoned',
          date: 'Aug 15, 2024',
          dateLabel: 'Abandoned',
          position: 3
        }
      ]
    },
    {
      id: 'done',
      title: 'Done',
      status: 'done',
      projects: [
        {
          id: 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a',
          title: 'Supernova Deploy',
          description: 'Zero-config deployment tool for static sites.',
          status: 'done',
          date: 'Jul 1, 2024',
          dateLabel: 'Done',
          position: 0
        }
      ]
    }
  ]
};
