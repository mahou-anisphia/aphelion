import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BoardData, Project, ProjectStatus } from '../models/project.model';

@Injectable({ providedIn: 'root' })
export class BoardService {
  private http = inject(HttpClient);

  loadBoard() {
    return this.http.get<BoardData>('/api/board');
  }

  createProject(data: { title: string; description: string; status: ProjectStatus }) {
    return this.http.post<Project>('/api/projects', data);
  }

  patchProject(id: string, data: { title?: string; description?: string; status?: ProjectStatus; position?: number }) {
    return this.http.patch<Project>(`/api/projects/${id}`, data);
  }

  deleteProject(id: string) {
    return this.http.delete<void>(`/api/projects/${id}`);
  }

  clearBoard() {
    return this.http.delete<void>('/api/board');
  }
}
