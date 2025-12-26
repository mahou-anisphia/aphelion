import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { Board } from './pages/board/board';

export const routes: Routes = [
  {
    path: '',
    component: Home
  },
  {
    path: 'board',
    component: Board
  }
];
