import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-board-header',
  imports: [RouterLink, NzButtonModule, NzIconModule],
  templateUrl: './board-header.html',
  styleUrl: './board-header.scss'
})
export class BoardHeader {
  addProjectClick = output<void>();

  onAddProjectClick() {
    this.addProjectClick.emit();
  }
}
