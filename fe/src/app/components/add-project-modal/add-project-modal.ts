import { Component, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { KanbanColumn, Project, ProjectStatus } from '../../models/project.model';

export interface NewProjectData {
  title: string;
  description: string;
  status: ProjectStatus;
}

export interface UpdatedProjectData {
  id: string;
  title: string;
  description: string;
  status: ProjectStatus;
}

@Component({
  selector: 'app-add-project-modal',
  imports: [
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule
  ],
  templateUrl: './add-project-modal.html',
  styleUrl: './add-project-modal.scss'
})
export class AddProjectModal {
  private modal = inject(NzModalService);

  columns = input.required<KanbanColumn[]>();
  isVisible = false;
  mode: 'add' | 'edit' = 'add';
  editingProjectId: string | null = null;

  projectAdded = output<NewProjectData>();
  projectUpdated = output<UpdatedProjectData>();
  projectDeleteRequested = output<string>();

  projectForm = new FormGroup({
    title: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    description: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    status: new FormControl<ProjectStatus>('active', {
      validators: [Validators.required],
      nonNullable: true
    })
  });

  get modalTitle(): string {
    return this.mode === 'add' ? 'Add New Project' : 'Edit Project';
  }

  get okButtonText(): string {
    return this.mode === 'add' ? 'Add Project' : 'Save Changes';
  }

  open() {
    this.mode = 'add';
    this.editingProjectId = null;
    this.isVisible = true;
  }

  openEdit(project: Project) {
    this.mode = 'edit';
    this.editingProjectId = project.id;
    this.projectForm.reset({
      title: project.title,
      description: project.description,
      status: project.status,
    });
    this.isVisible = true;
  }

  close() {
    this.isVisible = false;
    this.mode = 'add';
    this.editingProjectId = null;
    this.projectForm.reset({ status: 'active' });
  }

  handleCancel() {
    if (this.projectForm.dirty) {
      this.modal.confirm({
        nzTitle: 'Are you sure you want to cancel?',
        nzContent: "You'll lose what you filled in here.",
        nzOkText: 'Yes, discard',
        nzOkDanger: true,
        nzCancelText: 'Keep editing',
        nzClassName: 'dark-confirm-modal',
        nzOnOk: () => this.close()
      });
    } else {
      this.close();
    }
  }

  handleOk() {
    if (this.projectForm.valid) {
      const value = this.projectForm.getRawValue();
      if (this.mode === 'add') {
        this.projectAdded.emit(value);
      } else if (this.editingProjectId) {
        this.projectUpdated.emit({ id: this.editingProjectId, ...value });
      }
      this.close();
    } else {
      Object.values(this.projectForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  handleDelete() {
    if (this.editingProjectId) {
      this.projectDeleteRequested.emit(this.editingProjectId);
    }
  }
}
