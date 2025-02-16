import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {
  settingsForm: FormGroup;
  resumeFileName: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService) {
    this.settingsForm = this.fb.group({
      jobTitle: [''],
      interestedRoles: ['']
    });
  }

  ngOnInit(): void {
    // Load existing settings
    this.settingsForm.patchValue({
      jobTitle: this.authService.getJobTitle(),
      interestedRoles: this.authService.getInterestedRoles()
    });

    this.resumeFileName = this.authService.getResumeName();
  }

  onResumeUpload(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.resumeFileName = file.name;
      this.authService.saveResume(file);
    }
  }

  saveSettings(): void {
    this.authService.saveJobTitle(this.settingsForm.value.jobTitle);
    this.authService.saveInterestedRoles(this.settingsForm.value.interestedRoles);
  }
}
