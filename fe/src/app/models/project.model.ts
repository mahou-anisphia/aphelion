export type ProjectStatus = 'active' | 'paused' | 'abandoned' | 'archived';

export interface Project {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
  date: string;
  dateLabel: string; // e.g., "Started", "Paused", "Abandoned", "Archived"
  position: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  status: ProjectStatus;
  projects: Project[];
}

export interface BoardData {
  columns: KanbanColumn[];
}
