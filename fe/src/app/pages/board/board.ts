import { Component, signal, computed, viewChild, effect } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BoardHeader } from '../../components/board-header/board-header';
import { KanbanBoard } from '../../components/kanban-board/kanban-board';
import { AddProjectModal, NewProjectData } from '../../components/add-project-modal/add-project-modal';
import { BoardData } from '../../models/project.model';

const STORAGE_KEY = 'stellar-guide-board-data';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, KanbanBoard, AddProjectModal, NzButtonModule, NzIconModule],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board {
  protected boardData = signal<BoardData>(this.loadBoardData());
  protected isEmpty = computed(() => this.boardData().columns.every((col) => col.projects.length === 0));
  private addProjectModal = viewChild.required(AddProjectModal);

  constructor() {
    // Auto-save to local storage whenever board data changes
    effect(() => {
      const data = this.boardData();
      this.saveBoardData(data);
    });
  }

  private loadBoardData(): BoardData {
    const storedData = localStorage.getItem(STORAGE_KEY);

    if (storedData) {
      return JSON.parse(storedData);
    }

    return this.getInitialBoardData();
  }

  private saveBoardData(data: BoardData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  private getInitialBoardData(): BoardData {
    return {
      columns: [
        { id: 'active', title: 'Active', status: 'active', projects: [] },
        { id: 'paused', title: 'Paused', status: 'paused', projects: [] },
        { id: 'abandoned', title: 'Abandoned', status: 'abandoned', projects: [] },
        { id: 'done', title: 'Done', status: 'done', projects: [] }
      ]
    };
  }

  openAddProjectModal() {
    this.addProjectModal().open();
  }

  onProjectAdded(newProjectData: NewProjectData) {
    this.boardData.update((data) => {
      const targetColumn = data.columns.find((col) => col.status === newProjectData.status);
      if (!targetColumn) return data;

      const columnTitle = targetColumn.title;
      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const newProject = {
        id: crypto.randomUUID(),
        title: newProjectData.title,
        description: newProjectData.description,
        status: newProjectData.status,
        date: currentDate,
        dateLabel: columnTitle,
        position: 0
      };

      // Update positions of existing projects
      targetColumn.projects.forEach((project) => {
        project.position += 1;
      });

      targetColumn.projects.unshift(newProject);
      return { ...data };
    });
  }

  onProjectReordered(event: { columnId: string; projectId: string; newIndex: number }) {
    this.boardData.update((data) => {
      const column = data.columns.find((col) => col.id === event.columnId);
      if (!column) return data;

      const currentIndex = column.projects.findIndex((p) => p.id === event.projectId);
      if (currentIndex === -1) return data;

      const [project] = column.projects.splice(currentIndex, 1);
      column.projects.splice(event.newIndex, 0, project);

      // Update positions for all projects in the column
      column.projects.forEach((proj, index) => {
        proj.position = index;
      });

      return { ...data };
    });
  }

  onProjectMoved(event: { projectId: string; fromColumnId: string; toColumnId: string }) {
    this.boardData.update((data) => {
      const fromColumn = data.columns.find((col) => col.id === event.fromColumnId);
      const toColumn = data.columns.find((col) => col.id === event.toColumnId);

      if (!fromColumn || !toColumn) return data;

      const projectIndex = fromColumn.projects.findIndex((p) => p.id === event.projectId);
      if (projectIndex === -1) return data;

      const [project] = fromColumn.projects.splice(projectIndex, 1);
      project.status = toColumn.status;

      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      project.date = currentDate;
      project.dateLabel = toColumn.title;
      project.position = toColumn.projects.length;

      toColumn.projects.push(project);

      // Update positions in the source column after removal
      fromColumn.projects.forEach((proj, index) => {
        proj.position = index;
      });

      return { ...data };
    });
  }
}
