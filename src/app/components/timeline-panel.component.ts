import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InteractionStep } from '../models/timeline.models';
import { TimelineService } from '../services/timeline.service';

@Component({
  selector: 'app-timeline-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="panel">
      <div class="heading">
        <div>
          <p class="eyebrow">Last interaction inspector</p>
          <h1>Why Angular reacted</h1>
          <p class="subtext">Nothing appears here until a user causes it.</p>
        </div>
        <div class="actions" *ngIf="timeline.record() as record">
          <button type="button" (click)="timeline.replay()">Replay steps</button>
          <button type="button" (click)="timeline.clear()">Clear</button>
        </div>
      </div>

      <ng-container *ngIf="timeline.record() as record; else idleState">
        <section class="event-card">
          <div>
            <span class="label">Action</span>
            <strong>{{ record.action }}</strong>
          </div>
          <div>
            <span class="label">Component</span>
            <strong>&lt;{{ record.component }}&gt;</strong>
          </div>
          <div>
            <span class="label">Trigger Type</span>
            <strong>{{ record.triggerType }}</strong>
          </div>
          <div>
            <span class="label">Time</span>
            <strong>{{ record.startedAtLabel }}</strong>
          </div>
        </section>

        <section class="section">
          <div class="section-title">
            <h2>Step-by-step execution</h2>
            <p>This is the causal chain for the last user action, not a live event stream.</p>
          </div>

          <article
            class="step"
            *ngFor="let step of visibleSteps(record.steps); let index = index"
            [class.highlight]="!!step.component">
            <div class="step-index">{{ index + 1 }}</div>
            <div class="step-copy">
              <h3>{{ iconFor(step.kind) }} {{ step.title }}</h3>
              <p>{{ step.detail }}</p>
            </div>
          </article>
        </section>

        <section class="grid two-up">
          <article class="section compact">
            <h2>Lifecycle hooks fired</h2>
            <p *ngIf="record.hooks.length; else noHooks">{{ record.hooks.join(', ') }}</p>
          </article>

          <article class="section compact">
            <h2>What changed in the UI</h2>
            <p>{{ record.uiChange }}</p>
          </article>
        </section>

        <section class="grid two-up">
          <article class="section compact">
            <h2>Components affected</h2>
            <div class="list-block">
              <span class="list-label">Checked</span>
              <p>{{ joinList(record.componentsChecked) }}</p>
            </div>
            <div class="list-block">
              <span class="list-label">Skipped</span>
              <p>{{ joinList(record.componentsSkipped) }}</p>
            </div>
          </article>

          <article class="section compact">
            <h2>Why it happened</h2>
            <ul>
              <li *ngFor="let reason of record.reasons">{{ reason }}</li>
            </ul>
          </article>
        </section>

        <section class="section compact">
          <h2>Optimization insight</h2>
          <p>{{ record.optimization }}</p>
        </section>
      </ng-container>

      <ng-template #idleState>
        <section class="idle">
          <h2>Idle until the next interaction</h2>
          <p>Click, type, paginate, submit, or navigate on the left. The inspector will explain exactly what Angular did for that one action.</p>
        </section>
      </ng-template>

      <ng-template #noHooks>
        <p>No lifecycle hooks were captured for the last interaction.</p>
      </ng-template>
    </section>
  `,
  styles: [`
    .panel {
      height: calc(100vh - 40px);
      position: sticky;
      top: 20px;
      overflow: auto;
      border: 1px solid var(--line);
      background: rgba(16, 29, 45, 0.96);
      color: #f3f7fb;
      border-radius: 30px;
      padding: 24px;
      box-shadow: var(--shadow);
    }

    .heading,
    .event-card,
    .section-title,
    .grid {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: start;
    }

    .heading h1,
    .section h2,
    .step h3 {
      margin: 0;
    }

    .eyebrow,
    .subtext,
    .label,
    .section-title p,
    .section p,
    li,
    .idle p,
    .list-label {
      color: rgba(243, 247, 251, 0.74);
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 10px;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.12);
      color: inherit;
    }

    .event-card,
    .section,
    .idle {
      margin-top: 22px;
      padding: 18px;
      border-radius: 22px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }

    .event-card {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .event-card div,
    .list-block {
      display: grid;
      gap: 5px;
    }

    .label,
    .list-label {
      font-size: 0.76rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .step {
      display: grid;
      grid-template-columns: 38px 1fr;
      gap: 14px;
      padding: 14px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      animation: enter 280ms ease;
    }

    .step:first-of-type {
      border-top: 0;
      padding-top: 0;
    }

    .step-index {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: rgba(255, 255, 255, 0.1);
      font-weight: 700;
    }

    .step.highlight .step-index {
      background: rgba(12, 124, 120, 0.35);
      box-shadow: 0 0 0 6px rgba(12, 124, 120, 0.12);
    }

    .step-copy {
      display: grid;
      gap: 4px;
    }

    .two-up {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .compact {
      margin-top: 22px;
    }

    ul {
      margin: 10px 0 0;
      padding-left: 18px;
    }

    li + li {
      margin-top: 8px;
    }

    .idle {
      min-height: 240px;
      display: grid;
      place-content: center;
      text-align: center;
    }

    @keyframes enter {
      from {
        opacity: 0;
        transform: translateY(6px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @media (max-width: 1080px) {
      .panel {
        position: relative;
        top: auto;
        height: auto;
      }
    }

    @media (max-width: 760px) {
      .event-card,
      .two-up {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TimelinePanelComponent {
  constructor(public readonly timeline: TimelineService) {}

  visibleSteps(steps: InteractionStep[]): InteractionStep[] {
    return steps.slice(0, this.timeline.replayVisibleSteps());
  }

  iconFor(kind: string): string {
    return {
      zone: 'Zone',
      cd: 'CD',
      component: 'Check',
      validation: 'Validation',
      observable: 'Observable',
      dom: 'DOM',
      destroy: 'Destroy'
    }[kind] ?? 'Step';
  }

  joinList(items: string[]): string {
    return items.length ? items.join(', ') : 'None for this interaction.';
  }
}
