import { Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { KanbanColumn, ProjectStatus } from '../../models/project.model';

export interface NewProjectData {
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
  columns = input.required<KanbanColumn[]>();
  isVisible = false;
  projectAdded = output<NewProjectData>();

  projectForm = new FormGroup({
    title: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    description: new FormControl('', { validators: [Validators.required], nonNullable: true }),
    status: new FormControl<ProjectStatus>('active', {
      validators: [Validators.required],
      nonNullable: true
    })
  });

  open() {
    this.isVisible = true;
  }

  handleCancel() {
    this.isVisible = false;
    this.projectForm.reset({ status: 'active' });
  }

  handleOk() {
    if (this.projectForm.valid) {
      this.projectAdded.emit(this.projectForm.getRawValue());
      this.isVisible = false;
      this.projectForm.reset({ status: 'active' });
    } else {
      Object.values(this.projectForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }
}
