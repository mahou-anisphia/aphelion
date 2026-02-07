import { Component, signal, viewChild } from '@angular/core';
import { BoardHeader } from '../../components/board-header/board-header';
import { KanbanBoard } from '../../components/kanban-board/kanban-board';
import { AddProjectModal, NewProjectData } from '../../components/add-project-modal/add-project-modal';
import { MOCKUP_BOARD_DATA } from '../../data/mockup-board.data';
import { BoardData } from '../../models/project.model';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, KanbanBoard, AddProjectModal],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board {
  protected boardData = signal<BoardData>(MOCKUP_BOARD_DATA);
  private addProjectModal = viewChild.required(AddProjectModal);

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
