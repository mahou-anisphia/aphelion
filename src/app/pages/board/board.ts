import { Component, signal } from '@angular/core';
import { BoardHeader } from '../../components/board-header/board-header';
import { KanbanBoard } from '../../components/kanban-board/kanban-board';
import { MOCKUP_BOARD_DATA } from '../../data/mockup-board.data';
import { BoardData } from '../../models/project.model';

@Component({
  selector: 'app-board',
  imports: [BoardHeader, KanbanBoard],
  templateUrl: './board.html',
  styleUrl: './board.scss'
})
export class Board {
  protected boardData = signal<BoardData>(MOCKUP_BOARD_DATA);

  onProjectMoved(event: { projectId: string; fromColumnId: string; toColumnId: string }) {
    this.boardData.update((data) => {
      const fromColumn = data.columns.find((col) => col.id === event.fromColumnId);
      const toColumn = data.columns.find((col) => col.id === event.toColumnId);

      if (!fromColumn || !toColumn) return data;

      const projectIndex = fromColumn.projects.findIndex((p) => p.id === event.projectId);
      if (projectIndex === -1) return data;

      const [project] = fromColumn.projects.splice(projectIndex, 1);
      project.status = toColumn.status;
      toColumn.projects.push(project);

      return { ...data };
    });
  }
}
