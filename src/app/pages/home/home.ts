import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-home',
  imports: [NzButtonModule, NzIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {
  protected readonly title = signal('Aphelion');
  protected readonly subtitle = signal('Track what drifts. Revive what matters.');
  protected readonly description = signal(
    'Your projects orbit. Some thrive, some drift to the farthest point. Keep them all in sight.'
  );

  constructor(private router: Router) {}

  protected navigateToBoard(): void {
    this.router.navigate(['/board']);
  }
}
