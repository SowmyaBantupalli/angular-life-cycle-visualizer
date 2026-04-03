import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-lazy-analytics-tab',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="lazy-tab" [class.checked]="lifecycleTracker.isActive(componentName)">
      <p class="eyebrow">Lazy tab content</p>
      <h3>Analytics tab mounted on first open</h3>
      <p>This panel is only created the first time the user opens the Analytics tab, which makes it useful for teaching component mount timing.</p>
      <div class="metrics">
        <article>
          <strong>42%</strong>
          <span>CD savings with OnPush</span>
        </article>
        <article>
          <strong>11ms</strong>
          <span>Average tab switch cost</span>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .lazy-tab {
      display: grid;
      gap: 12px;
      padding: 12px 0 4px;
    }

    .eyebrow {
      margin: 0;
      color: var(--brand);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.74rem;
      font-weight: 700;
    }

    h3,
    p {
      margin: 0;
    }

    p {
      color: var(--muted);
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    article {
      padding: 16px;
      border-radius: 18px;
      background: rgba(12, 124, 120, 0.08);
      display: grid;
      gap: 6px;
    }

    strong {
      font-size: 1.4rem;
    }

    span {
      color: var(--muted);
    }
  `]
})
export class LazyAnalyticsTabComponent extends TrackedComponentBase {
  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService
  ) {
    super('LazyAnalyticsTabComponent', lifecycleTracker, changeDetection);
  }
}
