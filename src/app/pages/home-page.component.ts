import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="home" [class.checked]="lifecycleTracker.isActive(componentName)">
      <div class="hero">
        <p class="eyebrow">Angular Interaction to Lifecycle Explainer</p>
        <h1>A realistic UI that explains one Angular reaction at a time.</h1>
        <p>
          Interact with the dashboard like a real product. The inspector on the right only wakes up when you do something,
          then explains what triggered Angular, what ran, what changed, and why.
        </p>
        <div class="actions">
          <a routerLink="/dashboard" (click)="openDashboard()">Open dashboard scenario</a>
          <a routerLink="/forms" (click)="openForms()">Open form scenario</a>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .home {
      min-height: 320px;
      border-radius: 24px;
      padding: 32px;
      background:
        linear-gradient(135deg, rgba(12, 124, 120, 0.14), transparent 58%),
        linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(247, 251, 253, 0.9));
    }

    .eyebrow {
      color: var(--brand);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-weight: 700;
      font-size: 0.75rem;
    }

    h1 {
      font-size: clamp(2rem, 4vw, 3.4rem);
      line-height: 1.05;
      margin: 10px 0 16px;
      max-width: 13ch;
    }

    p {
      color: var(--muted);
      max-width: 60ch;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      flex-wrap: wrap;
    }

    .actions a {
      text-decoration: none;
      padding: 13px 18px;
      border-radius: 14px;
      background: var(--brand);
      color: white;
      font-weight: 700;
    }
  `]
})
export class HomePageComponent extends TrackedComponentBase {
  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService,
    private readonly zoneTracker: ZoneTrackerService
  ) {
    super('HomePageComponent', lifecycleTracker, changeDetection);
  }

  openDashboard(): void {
    this.zoneTracker.beginInteraction({
      action: 'User clicked the dashboard CTA',
      component: 'HomePageComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A hero CTA click reached Angular through Zone.js.',
        'Angular Router started navigation to the dashboard route.',
        'The outlet will replace the home page with the dashboard view.'
      ],
      optimization: 'Navigation always recreates the routed component. The optimization opportunity starts inside the destination page once it mounts.',
      uiChange: 'The home view started transitioning to the dashboard route.'
    });
    this.changeDetection.markDomUpdate('The home view started transitioning to the dashboard route.');
  }

  openForms(): void {
    this.zoneTracker.beginInteraction({
      action: 'User clicked the forms CTA',
      component: 'HomePageComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A hero CTA click reached Angular through Zone.js.',
        'Angular Router started navigation to the forms route.',
        'The outlet will replace the home page with the forms view.'
      ],
      optimization: 'Navigation recreates route-level components by design. The useful optimization comes from reducing work inside the destination form screen.',
      uiChange: 'The home view started transitioning to the forms route.'
    });
    this.changeDetection.markDomUpdate('The home view started transitioning to the forms route.');
  }
}
