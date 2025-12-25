import { Component, input, output } from '@angular/core';
import { CdkDropList, CdkDragDrop } from '@angular/cdk/drag-drop';
import { KanbanColumn } from '../../models/project.model';
import { ProjectCard } from '../project-card/project-card';

@Component({
  selector: 'app-kanban-column',
  imports: [ProjectCard, CdkDropList],
  templateUrl: './kanban-column.html',
  styleUrl: './kanban-column.scss'
})
export class KanbanColumnComponent {
  column = input.required<KanbanColumn>();
  projectMoved = output<{ projectId: string; fromColumnId: string; toColumnId: string }>();

  onDrop(event: CdkDragDrop<KanbanColumn>) {
    const projectId = event.item.data;
    const fromColumnId = event.previousContainer.data.id;
    const toColumnId = event.container.data.id;

    if (fromColumnId !== toColumnId) {
      this.projectMoved.emit({ projectId, fromColumnId, toColumnId });
    }
  }
}
