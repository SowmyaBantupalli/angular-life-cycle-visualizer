import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="settings" [class.checked]="lifecycleTracker.isActive(componentName)">
      <h1>Settings</h1>
      <p>Toggle the advanced block to see how a simple conditional view creates a focused Angular reaction.</p>
      <button type="button" (click)="toggle()">Trigger a settings interaction</button>
      <div class="tile" *ngIf="showAdvanced">Advanced preferences mounted. Hide me to see the view tear down.</div>
    </section>
  `,
  styles: [`
    .settings {
      display: grid;
      gap: 18px;
      border-radius: 24px;
      padding: 24px;
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid var(--line);
    }

    .tile {
      padding: 18px;
      border-radius: 18px;
      background: rgba(12, 124, 120, 0.08);
      color: var(--brand);
      font-weight: 700;
    }

    button {
      width: fit-content;
      border: 0;
      border-radius: 16px;
      padding: 12px 18px;
      cursor: pointer;
      background: var(--brand);
      color: white;
      font-weight: 700;
    }
  `]
})
export class SettingsPageComponent extends TrackedComponentBase {
  showAdvanced = false;

  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService,
    private readonly zoneTracker: ZoneTrackerService
  ) {
    super('SettingsComponent', lifecycleTracker, changeDetection);
  }

  toggle(): void {
    this.zoneTracker.beginInteraction({
      action: `User ${this.showAdvanced ? 'hid' : 'revealed'} advanced settings`,
      component: 'SettingsComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A button click reached Angular through Zone.js.',
        'Angular re-evaluated the *ngIf condition for the advanced panel.',
        'The settings view changed because the conditional block mounted or unmounted.'
      ],
      optimization: 'This is a localized conditional render. Splitting large settings sections into smaller OnPush blocks keeps the work contained.',
      uiChange: `Advanced settings panel ${this.showAdvanced ? 'unmounted' : 'mounted'}.`
    });
    this.showAdvanced = !this.showAdvanced;
    this.changeDetection.markDomUpdate(`Advanced settings panel ${this.showAdvanced ? 'mounted' : 'unmounted'}.`);
  }
}
