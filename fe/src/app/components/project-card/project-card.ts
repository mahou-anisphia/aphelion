import { Component, input } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { Project } from '../../models/project.model';

@Component({
  selector: 'app-project-card',
  imports: [NzButtonModule, NzIconModule, CdkDrag],
  templateUrl: './project-card.html',
  styleUrl: './project-card.scss'
})
export class ProjectCard {
  project = input.required<Project>();
}
