import { Component, input, output } from '@angular/core';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BoardData } from '../../models/project.model';
import { KanbanColumnComponent } from '../kanban-column/kanban-column';

@Component({
  selector: 'app-kanban-board',
  imports: [KanbanColumnComponent, CdkDropListGroup],
  templateUrl: './kanban-board.html',
  styleUrl: './kanban-board.scss'
})
export class KanbanBoard {
  boardData = input.required<BoardData>();
  projectMoved = output<{ projectId: string; fromColumnId: string; toColumnId: string }>();
  projectReordered = output<{ columnId: string; projectId: string; newIndex: number }>();
}
