export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Aphelion API',
    description:
      'Kanban board API for tracking abandoned, paused, and sidelined projects. ' +
      'Columns are fixed (Active / Paused / Abandoned / Done). No auth — access is controlled by the Tailscale tailnet.',
    version: '1.0.0',
  },
  tags: [
    { name: 'Board', description: 'Full board state' },
    { name: 'Projects', description: 'Individual project CRUD' },
  ],
  paths: {
    '/api/board': {
      get: {
        tags: ['Board'],
        summary: 'Get full board',
        description: 'Returns all projects grouped into the 4 fixed columns, ordered by position.',
        responses: {
          '200': {
            description: 'Board data',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/BoardData' },
              },
            },
          },
          '500': { description: 'Database error' },
        },
      },
      delete: {
        tags: ['Board'],
        summary: 'Clear board',
        description: 'Deletes every project from the database. Intended for dev / admin use.',
        responses: {
          '200': {
            description: 'Board cleared',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true } },
                },
              },
            },
          },
        },
      },
    },
    '/api/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        description:
          'Inserts the project at position 0 (top of the column) and shifts existing projects down.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateProjectInput' },
            },
          },
        },
        responses: {
          '201': {
            description: 'Created project (server-assigned id, date, dateLabel, and position)',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' },
              },
            },
          },
          '400': { description: 'Validation error' },
          '500': { description: 'Database error' },
        },
      },
    },
    '/api/projects/{id}': {
      patch: {
        tags: ['Projects'],
        summary: 'Edit, move, or reorder a project',
        description: [
          'One endpoint covers three operations:',
          '- **Edit fields** — send `title` and/or `description`.',
          '- **Move to column** — send `status` with a value different from the current one.',
          '  The server updates `date`, `dateLabel`, re-normalises positions in both columns.',
          '- **Reorder within column** — send `position` (0-based target index, same column).',
          '  The server re-normalises all sibling positions in a transaction.',
          '',
          'Fields can be combined: e.g. editing the title and moving columns in one request.',
        ].join('\n'),
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PatchProjectInput' },
            },
          },
        },
        responses: {
          '200': {
            description: 'Updated project',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Project' },
              },
            },
          },
          '400': { description: 'Validation error' },
          '404': { description: 'Project not found' },
          '500': { description: 'Database error' },
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project',
        description: 'Removes the project and re-normalises positions in its column.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': {
            description: 'Deleted',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean', example: true } },
                },
              },
            },
          },
          '404': { description: 'Project not found' },
          '500': { description: 'Database error' },
        },
      },
    },
  },
  components: {
    schemas: {
      ProjectStatus: {
        type: 'string',
        enum: ['active', 'paused', 'abandoned', 'done'],
        description: 'Which column the project belongs to.',
      },
      Project: {
        type: 'object',
        required: ['id', 'title', 'description', 'status', 'date', 'dateLabel', 'position'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string', example: 'Rust game engine' },
          description: { type: 'string', example: 'Started but never finished the renderer.' },
          status: { $ref: '#/components/schemas/ProjectStatus' },
          date: {
            type: 'string',
            description: 'Locale-formatted date string set by the server on create / move.',
            example: 'Jun 26, 2026',
          },
          dateLabel: {
            type: 'string',
            description: 'Human label for the date (mirrors the column title).',
            example: 'Active',
          },
          position: {
            type: 'integer',
            minimum: 0,
            description: '0-based index within the column.',
          },
        },
      },
      KanbanColumn: {
        type: 'object',
        required: ['id', 'title', 'status', 'projects'],
        properties: {
          id: { type: 'string', enum: ['active', 'paused', 'abandoned', 'done'] },
          title: { type: 'string', example: 'Active' },
          status: { $ref: '#/components/schemas/ProjectStatus' },
          projects: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' },
          },
        },
      },
      BoardData: {
        type: 'object',
        required: ['columns'],
        properties: {
          columns: {
            type: 'array',
            items: { $ref: '#/components/schemas/KanbanColumn' },
            minItems: 4,
            maxItems: 4,
            description: 'Always exactly 4 columns in order: active, paused, abandoned, done.',
          },
        },
      },
      CreateProjectInput: {
        type: 'object',
        required: ['title', 'description', 'status'],
        properties: {
          title: { type: 'string', minLength: 1, example: 'Rust game engine' },
          description: { type: 'string', minLength: 1, example: 'Started but never finished.' },
          status: { $ref: '#/components/schemas/ProjectStatus' },
        },
      },
      PatchProjectInput: {
        type: 'object',
        description: 'All fields are optional; send only what needs to change.',
        properties: {
          title: { type: 'string', minLength: 1 },
          description: { type: 'string', minLength: 1 },
          status: { $ref: '#/components/schemas/ProjectStatus' },
          position: { type: 'integer', minimum: 0 },
        },
      },
    },
  },
} as const;
