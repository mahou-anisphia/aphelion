import { Component, inject, signal, computed, viewChild, isDevMode } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { BoardHeader } from '../../components/board-header/board-header';
import { KanbanBoard } from '../../components/kanban-board/kanban-board';
import {
  AddProjectModal,
  NewProjectData,
  UpdatedProjectData,
} from '../../components/add-project-modal/add-project-modal';
import { BoardData, Project } from '../../models/project.model';
import { BoardService } from '../../services/board.service';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, KanbanBoard, AddProjectModal, NzButtonModule, NzIconModule],
  templateUrl: './board.html',
  styleUrl: './board.scss',
})
export class Board {
  protected boardData = signal<BoardData>(this.emptyBoardData());
  protected isEmpty = computed(() =>
    this.boardData().columns.every((col) => col.projects.length === 0),
  );
  protected isDev = isDevMode();
  private addProjectModal = viewChild.required(AddProjectModal);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private boardService = inject(BoardService);

  constructor() {
    this.loadBoard();
  }

  private emptyBoardData(): BoardData {
    return {
      columns: [
        { id: 'active', title: 'Active', status: 'active', projects: [] },
        { id: 'paused', title: 'Paused', status: 'paused', projects: [] },
        { id: 'abandoned', title: 'Abandoned', status: 'abandoned', projects: [] },
        { id: 'done', title: 'Done', status: 'done', projects: [] },
      ],
    };
  }

  private loadBoard() {
    this.boardService.loadBoard().subscribe({
      next: (data) => this.boardData.set(data),
      error: () => this.message.error('Failed to load board'),
    });
  }

  clearBoard() {
    this.modal.confirm({
      nzTitle: 'Clear all board data?',
      nzContent: 'This will permanently delete all projects from the database.',
      nzOkText: 'Clear',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzClassName: 'dark-confirm-modal',
      nzOnOk: () => {
        this.boardService.clearBoard().subscribe({
          next: () => {
            this.boardData.set(this.emptyBoardData());
            this.message.success('Board cleared');
          },
          error: () => this.message.error('Failed to clear board'),
        });
      },
    });
  }

  openAddProjectModal() {
    this.addProjectModal().open();
  }

  onProjectAdded(newProjectData: NewProjectData) {
    this.boardService.createProject(newProjectData).subscribe({
      next: (project) => {
        this.boardData.update((data) => {
          const col = data.columns.find((c) => c.status === project.status);
          if (!col) return data;
          col.projects.unshift(project);
          col.projects.forEach((p, i) => (p.position = i));
          return { ...data };
        });
        this.message.success(`Project "${project.title}" created`);
      },
      error: () => this.message.error('Failed to create project'),
    });
  }

  onProjectUpdated(data: UpdatedProjectData) {
    const { id, ...fields } = data;
    this.boardService.patchProject(id, fields).subscribe({
      next: () => this.loadBoard(),
      error: () => this.message.error('Failed to update project'),
    });
  }

  onProjectDeleteRequested(id: string) {
    this.modal.confirm({
      nzTitle: 'Delete this project?',
      nzContent: 'This action cannot be undone.',
      nzOkText: 'Delete',
      nzOkDanger: true,
      nzCancelText: 'Cancel',
      nzClassName: 'dark-confirm-modal',
      nzOnOk: () => {
        this.addProjectModal().close();
        this.boardService.deleteProject(id).subscribe({
          next: () => {
            this.boardData.update((data) => {
              for (const col of data.columns) {
                const idx = col.projects.findIndex((p) => p.id === id);
                if (idx !== -1) {
                  col.projects.splice(idx, 1);
                  col.projects.forEach((p, i) => (p.position = i));
                  break;
                }
              }
              return { ...data };
            });
            this.message.success('Project deleted');
          },
          error: () => this.message.error('Failed to delete project'),
        });
      },
    });
  }

  onProjectEditRequested(project: Project) {
    this.addProjectModal().openEdit(project);
  }

  onProjectReordered(event: { columnId: string; projectId: string; newIndex: number }) {
    // Optimistic update — the server re-normalises positions in its transaction
    this.boardData.update((data) => {
      const column = data.columns.find((col) => col.id === event.columnId);
      if (!column) return data;

      const currentIndex = column.projects.findIndex((p) => p.id === event.projectId);
      if (currentIndex === -1) return data;

      const [project] = column.projects.splice(currentIndex, 1);
      column.projects.splice(event.newIndex, 0, project);
      column.projects.forEach((p, i) => (p.position = i));

      return { ...data };
    });

    this.boardService.patchProject(event.projectId, { position: event.newIndex }).subscribe({
      error: () => this.loadBoard(),
    });
  }

  onProjectMoved(event: { projectId: string; fromColumnId: string; toColumnId: string }) {
    const toColumn = this.boardData().columns.find((col) => col.id === event.toColumnId);
    if (!toColumn) return;
    const newStatus = toColumn.status;

    // Optimistic update
    this.boardData.update((data) => {
      const fromColumn = data.columns.find((col) => col.id === event.fromColumnId);
      const destColumn = data.columns.find((col) => col.id === event.toColumnId);
      if (!fromColumn || !destColumn) return data;

      const projectIndex = fromColumn.projects.findIndex((p) => p.id === event.projectId);
      if (projectIndex === -1) return data;

      const [project] = fromColumn.projects.splice(projectIndex, 1);
      project.status = destColumn.status;
      project.position = destColumn.projects.length;
      destColumn.projects.push(project);

      fromColumn.projects.forEach((p, i) => (p.position = i));

      return { ...data };
    });

    this.boardService.patchProject(event.projectId, { status: newStatus }).subscribe({
      error: () => this.loadBoard(),
    });
  }
}
