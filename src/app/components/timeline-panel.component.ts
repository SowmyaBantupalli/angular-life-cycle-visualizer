import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { InteractionRecord, InteractionStep } from '../models/timeline.models';
import { TimelineService } from '../services/timeline.service';

type OverlayConcept =
  | 'zone'
  | 'cd'
  | 'component'
  | 'lifecycle'
  | 'dom'
  | 'validation'
  | 'observable'
  | 'destroy'
  | 'click'
  | 'focus'
  | 'blur'
  | 'input'
  | 'change'
  | 'hover'
  | 'async'
  | 'overlay';

interface OverlayContent {
  title: string;
  subtitle: string;
  whatItIs: string;
  whyItExists: string;
  whenItRuns: string;
  examples: string[];
  insight: string;
}

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
          <p class="subtext">Default view stays simple. Click a trigger, step, or hook to open the deeper explanation overlay.</p>
        </div>
        <div class="actions" *ngIf="timeline.record()">
          <button type="button" (click)="timeline.replay()">Replay steps</button>
          <button type="button" (click)="closeOverlay()" [disabled]="!overlayContent()">Close overlay</button>
          <button type="button" (click)="timeline.clear(); closeOverlay()">Clear</button>
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
            <button type="button" class="trigger-button" (click)="openTrigger(record)">
              {{ record.triggerType }}
            </button>
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

          <article class="step" *ngFor="let step of visibleSteps(record.steps); let index = index" [class.highlight]="!!step.component">
            <div class="step-index">{{ index + 1 }}</div>
            <div class="step-copy">
              <button type="button" class="step-title" (click)="openStep(step, record)">
                <span class="concept-chip">{{ iconFor(step.kind) }}</span>
                <span>{{ step.title }}</span>
              </button>
              <p>{{ step.detail }}</p>
              <button type="button" class="explain-button" (click)="openStep(step, record)">Explain deeper</button>
            </div>
          </article>
        </section>

        <section class="grid two-up">
          <article class="section compact">
            <div class="section-title">
              <h2>Lifecycle hooks fired</h2>
              <p>Only hooks captured during this interaction are shown.</p>
            </div>
            <div class="hook-list" *ngIf="record.hooks.length; else noHooks">
              <button type="button" class="hook-chip" *ngFor="let hook of record.hooks" (click)="openHook(hook, record)">
                {{ hook }}
              </button>
            </div>
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
          <p>Click, focus, type, blur, change, hover, submit, or navigate on the left. Then click any concept here to open the deeper explanation overlay.</p>
        </section>
      </ng-template>

      <ng-template #noHooks>
        <p>No lifecycle hooks were captured for the last interaction.</p>
      </ng-template>

      <div class="overlay-dim" *ngIf="overlayContent()" (click)="closeOverlay()"></div>
      <aside class="overlay" *ngIf="overlayContent() as overlay">
        <button type="button" class="overlay-close" (click)="closeOverlay()">Close</button>
        <p class="overlay-kicker">Deep explanation</p>
        <h2>{{ overlay.title }}</h2>
        <p class="overlay-subtitle">{{ overlay.subtitle }}</p>

        <section class="overlay-section">
          <h3>What it is</h3>
          <p>{{ overlay.whatItIs }}</p>
        </section>

        <section class="overlay-section">
          <h3>Why it exists</h3>
          <p>{{ overlay.whyItExists }}</p>
        </section>

        <section class="overlay-section">
          <h3>When it ran here</h3>
          <p>{{ overlay.whenItRuns }}</p>
        </section>

        <section class="overlay-section">
          <h3>Real examples</h3>
          <ul>
            <li *ngFor="let example of overlay.examples">{{ example }}</li>
          </ul>
        </section>

        <section class="overlay-section insight">
          <h3>Key insight</h3>
          <p>{{ overlay.insight }}</p>
        </section>
      </aside>
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
      isolation: isolate;
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
    .overlay h2,
    .overlay h3 {
      margin: 0;
    }

    .eyebrow,
    .subtext,
    .label,
    .section-title p,
    .section p,
    li,
    .idle p,
    .list-label,
    .overlay-subtitle,
    .overlay-kicker {
      color: rgba(243, 247, 251, 0.74);
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      justify-content: end;
    }

    button {
      border: 0;
      border-radius: 999px;
      padding: 10px 14px;
      cursor: pointer;
      background: rgba(255, 255, 255, 0.12);
      color: inherit;
    }

    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
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
    .list-label,
    .overlay-kicker {
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
      gap: 8px;
    }

    .step-title,
    .hook-chip,
    .explain-button,
    .trigger-button {
      width: fit-content;
      background: transparent;
      padding: 0;
      border-radius: 0;
      color: #f3f7fb;
      text-align: left;
    }

    .step-title {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-size: 1rem;
      font-weight: 700;
    }

    .concept-chip {
      display: inline-grid;
      place-items: center;
      min-width: 82px;
      padding: 6px 10px;
      border-radius: 999px;
      background: rgba(12, 124, 120, 0.2);
      color: #9ef0da;
      font-size: 0.78rem;
      font-weight: 700;
    }

    .explain-button,
    .hook-chip,
    .trigger-button {
      color: #8fd8ff;
      font-size: 0.88rem;
      text-decoration: underline;
      text-underline-offset: 3px;
    }

    .hook-list {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 12px;
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

    .overlay-dim {
      position: absolute;
      inset: 0;
      background: rgba(5, 10, 18, 0.56);
      backdrop-filter: blur(2px);
      z-index: 15;
      animation: fade-in 180ms ease;
    }

    .overlay {
      position: absolute;
      top: 20px;
      right: 20px;
      width: min(430px, calc(100% - 40px));
      max-height: calc(100% - 40px);
      overflow: auto;
      padding: 22px;
      border-radius: 26px;
      background: linear-gradient(180deg, rgba(24, 37, 54, 0.98), rgba(10, 18, 28, 0.98));
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
      z-index: 20;
      animation: slide-in 220ms ease;
    }

    .overlay-close {
      justify-self: end;
      margin-left: auto;
      margin-bottom: 12px;
    }

    .overlay-subtitle {
      margin-top: 8px;
      line-height: 1.45;
    }

    .overlay-section {
      margin-top: 18px;
      display: grid;
      gap: 8px;
      padding-top: 18px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .insight {
      background: rgba(12, 124, 120, 0.1);
      border-radius: 18px;
      padding: 18px;
      border-top: 0;
    }

    @keyframes enter {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes slide-in {
      from { opacity: 0; transform: translateX(18px); }
      to { opacity: 1; transform: translateX(0); }
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

      .overlay {
        left: 20px;
        width: auto;
      }
    }
  `]
})
export class TimelinePanelComponent {
  private readonly overlayState = signal<{ concept: OverlayConcept; hook?: string } | null>(null);

  readonly overlayContent = computed<OverlayContent | null>(() => {
    const state = this.overlayState();
    const record = this.timeline.record();
    if (!state || !record) {
      return null;
    }

    return this.buildOverlay(record, state.concept, state.hook);
  });

  constructor(public readonly timeline: TimelineService) {}

  visibleSteps(steps: InteractionStep[]): InteractionStep[] {
    return steps.slice(0, this.timeline.replayVisibleSteps());
  }

  iconFor(kind: string): string {
    return {
      zone: 'Zone.js',
      cd: 'Change detection',
      component: 'Component check',
      validation: 'Validation',
      observable: 'Observable',
      dom: 'DOM update',
      destroy: 'Destroy'
    }[kind] ?? 'Step';
  }

  openStep(step: InteractionStep, record: InteractionRecord): void {
    const conceptMap: Record<string, OverlayConcept> = {
      zone: 'zone',
      cd: 'cd',
      component: 'component',
      validation: 'validation',
      observable: 'observable',
      dom: 'dom',
      destroy: 'destroy'
    };

    this.overlayState.set({ concept: conceptMap[step.kind] ?? 'component' });
    this.timeline.replayVisibleSteps.set(record.steps.length);
  }

  openHook(hook: string, record: InteractionRecord): void {
    this.overlayState.set({ concept: 'lifecycle', hook });
    this.timeline.replayVisibleSteps.set(record.steps.length);
  }

  openTrigger(record: InteractionRecord): void {
    const trigger = record.triggerType.toLowerCase();
    if (trigger.includes('focus')) {
      this.overlayState.set({ concept: 'focus' });
    } else if (trigger.includes('blur')) {
      this.overlayState.set({ concept: 'blur' });
    } else if (trigger.includes('input')) {
      this.overlayState.set({ concept: 'input' });
    } else if (trigger.includes('change')) {
      this.overlayState.set({ concept: 'change' });
    } else if (trigger.includes('hover')) {
      this.overlayState.set({ concept: 'hover' });
    } else if (trigger.includes('async')) {
      this.overlayState.set({ concept: 'async' });
    } else if (trigger.includes('overlay')) {
      this.overlayState.set({ concept: 'overlay' });
    } else {
      this.overlayState.set({ concept: 'click' });
    }
  }

  closeOverlay(): void {
    this.overlayState.set(null);
  }

  joinList(items: string[]): string {
    return items.length ? items.join(', ') : 'None for this interaction.';
  }

  private buildOverlay(record: InteractionRecord, concept: OverlayConcept, hook?: string): OverlayContent {
    const context = `Triggered here because ${record.action.toLowerCase()}.`;
    const checked = this.joinList(record.componentsChecked);
    const skipped = this.joinList(record.componentsSkipped);

    switch (concept) {
      case 'zone':
        return {
          title: 'Zone.js - Event interception engine',
          subtitle: context,
          whatItIs: 'Zone.js patches browser async APIs like click handlers, focus changes, blur transitions, timers, and promises so Angular can notice when work finished and decide whether the UI needs to be checked.',
          whyItExists: 'Without Zone.js, Angular would not know a click, focus change, blur transition, timer, or promise settled unless you manually told it to run change detection.',
          whenItRuns: `In this interaction, Zone.js was the first thing in the chain because ${record.triggerType.toLowerCase()} reached Angular before anything else happened.`,
          examples: [
            `This example: ${record.action}. Zone.js noticed the event before Angular checked ${record.component}.`,
            'Another common case: setTimeout completes, Zone.js notices it, and Angular can update the bound UI automatically.'
          ],
          insight: 'Zone.js is the reason Angular feels automatic. If Angular reacted after a focus, blur, click, or timer without you calling anything manually, Zone.js is the missing link.'
        };
      case 'cd':
        return {
          title: 'Change detection - Angular checking work',
          subtitle: context,
          whatItIs: 'Change detection walks the relevant component tree, re-evaluates bindings, and decides whether the DOM needs to change.',
          whyItExists: 'Angular needs a consistent pass that compares current component state against template bindings. That is how it knows what should visually update.',
          whenItRuns: `Here it ran after the event reached Angular, then checked ${checked}. Components skipped in this pass: ${skipped}.`,
          examples: [
            `This example: ${record.action}. Angular ran a pass so ${record.uiChange.toLowerCase()}`,
            'Another common case: clicking pagination can force Angular to re-evaluate an ngFor block and decide whether row views should be reused or recreated.'
          ],
          insight: 'Most Angular performance problems are really change-detection problems. If you understand why a check ran and what got skipped, you understand the real cost.'
        };
      case 'component':
        return {
          title: 'Component check - Why this component was touched',
          subtitle: context,
          whatItIs: 'A component check means Angular visited that component during change detection and evaluated its bindings, hooks, and child views as needed.',
          whyItExists: 'Angular has to decide which components participate in the current pass. Checked components may update, skipped components keep their previous DOM.',
          whenItRuns: `In this interaction, Angular checked ${checked}. It skipped ${skipped}, which is the useful sign that the work stayed focused.`,
          examples: [
            `This example: ${record.component} was part of the pass because ${record.reasons[0].toLowerCase()}`,
            'Another common case: a list update checks the list region, and trackBy helps Angular reuse child rows instead of rebuilding all of them.'
          ],
          insight: 'A component being checked does not mean its DOM changed. It only means Angular had to ask the question.'
        };
      case 'lifecycle':
        return {
          title: `Lifecycle hooks - ${hook ?? 'Angular timing signals'}`,
          subtitle: context,
          whatItIs: 'Lifecycle hooks are Angular callbacks that fire at specific points while a component is created, checked, rendered, or destroyed.',
          whyItExists: 'They let you react to Angular timing instead of guessing. ngDoCheck tells you a check is happening. ngOnDestroy tells you the instance is going away.',
          whenItRuns: hook
            ? `${hook} appeared in this interaction because Angular was already checking or tearing down part of the tree after ${record.action.toLowerCase()}.`
            : `These hooks appeared because Angular checked ${checked} during this user-caused interaction.`,
          examples: [
            `This example: ${record.hooks.length ? record.hooks.join(', ') : 'no hooks'} were captured while Angular handled ${record.action.toLowerCase()}.`,
            'Another common case: when an *ngIf becomes false or a routed page is replaced, ngOnDestroy fires because Angular removes that component instance.'
          ],
          insight: 'A lifecycle hook only matters when you connect it to a cause. The useful question is never "what is ngDoCheck?" but "why did ngDoCheck run right now?"'
        };
      case 'dom':
        return {
          title: 'DOM update - What the user finally saw',
          subtitle: context,
          whatItIs: 'A DOM update means Angular finished its checking work and then applied the necessary visual changes to the rendered UI.',
          whyItExists: 'Change detection alone only decides what should be different. The DOM update is the moment those decisions become visible on screen.',
          whenItRuns: `In this interaction, the visible result was: ${record.uiChange}`,
          examples: [
            `This example: ${record.uiChange}`,
            'Another common case: after a list mutation, Angular removes or reorders actual DOM nodes so the screen matches the new array state.'
          ],
          insight: 'The DOM update comes after Angular reasons about state. If the screen changed, the decision happened earlier during the check.'
        };
      case 'validation':
        return {
          title: 'Validation - Form rules reacting to input',
          subtitle: context,
          whatItIs: 'Validation is Angular evaluating form rules after control values change or blur occurs so it can decide whether a field or submission is valid.',
          whyItExists: 'Without validation, Angular would happily accept incomplete or malformed input and the template would have no reliable status to display.',
          whenItRuns: `Here it ran because the interaction changed form state, so Angular had to update helper text, validity, touched state, or submission readiness.`,
          examples: [
            `This example: ${record.action}. Angular ran validators before deciding that ${record.uiChange.toLowerCase()}`,
            'Another common case: an async email validator waits for an observable result, then Angular updates the error state when it resolves.'
          ],
          insight: 'Validation is not separate from change detection. It is one of the reasons the next check has useful new information.'
        };
      case 'observable':
        return {
          title: 'Observable emission - Async data entering the UI',
          subtitle: context,
          whatItIs: 'An observable emission is asynchronous application state arriving after the original event, such as debounced input or a simulated API response.',
          whyItExists: 'Angular apps often respond to streams instead of one-off values. Observable emissions give Angular new state to render after the initial event.',
          whenItRuns: `In this interaction, the observable step appeared because async state followed the original user action before Angular updated the UI.`,
          examples: [
            `This example: ${record.action}. The stream emitted and Angular continued the explanation chain from there.`,
            'Another common case: a debounced search stream emits after typing stops, then Angular updates suggestions without requiring another click.'
          ],
          insight: 'The user starts the story, but observables often finish it. That is why Angular explanations need both the event and the async follow-up.'
        };
      case 'destroy':
        return {
          title: 'Destroy - Component teardown',
          subtitle: context,
          whatItIs: 'Destroy means Angular removed a component instance from the view tree and fired its teardown lifecycle so cleanup can happen.',
          whyItExists: 'Angular needs a clear moment to release subscriptions, detach views, and stop treating the old component as part of the screen.',
          whenItRuns: `Here it ran because the interaction changed the rendered structure after ${record.action.toLowerCase()}.`,
          examples: [
            `This example: ${record.action}. Angular removed part of the rendered tree while updating the UI.`,
            'Another common case: route navigation replaces the old page component, so Angular destroys that page before mounting the new one.'
          ],
          insight: 'Destroy is a useful signal that structure changed, not just data. If you see teardown, the component stopped being part of the visible tree.'
        };
      case 'focus':
        return {
          title: 'Focus event - Element gained attention',
          subtitle: context,
          whatItIs: 'A focus event fires when an element becomes the active target for keyboard input or accessibility navigation.',
          whyItExists: 'Without focus, keyboard users cannot interact reliably, and the UI cannot show which control is currently active.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} and Angular needed to reflect the new active field state.`,
          examples: [
            `This example: ${record.action}. Angular applied focus styling and prepared the control for input.`,
            'Another common case: keyboard navigation tabs into an input, focus fires, and Angular updates the active visual state without any click.'
          ],
          insight: 'Focus is not just cosmetic. It is the backbone of keyboard interaction and often the first step before input or blur-driven validation.'
        };
      case 'blur':
        return {
          title: 'Blur event - Element lost focus',
          subtitle: context,
          whatItIs: 'A blur event fires when an element stops being the active focused control.',
          whyItExists: 'Blur is how Angular and your UI know the user moved on. It is the moment touched state, validation messages, and menu-closing behavior often become correct.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} and Angular needed to react after focus left the current element.`,
          examples: [
            `This example: ${record.action}. Angular updated the UI after the control or dropdown lost focus.`,
            'Another common case: a dropdown closes on blur so it does not stay stuck open after the user tabs away.'
          ],
          insight: 'Blur is where a lot of real form behavior becomes visible. If you skip blur, you miss touched-state validation and many important accessibility flows.'
        };
      case 'input':
        return {
          title: 'Input event - Text changed immediately',
          subtitle: context,
          whatItIs: 'An input event fires as the user changes a text-like control, usually on each keystroke.',
          whyItExists: 'Angular needs it to react to live typing, emit valueChanges, and refresh helper text, computed state, or validation signals.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} and Angular responded to the latest typed value right away.`,
          examples: [
            `This example: ${record.action}. Angular processed the new value and updated the control state.`,
            'Another common case: live search listens to input, debounces it, and updates the view from the emitted stream.'
          ],
          insight: 'Input is the fast path for typing. It is different from change because it reacts during editing, not only after the control commits a new value.'
        };
      case 'change':
        return {
          title: 'Change event - Control committed a new value',
          subtitle: context,
          whatItIs: 'A change event fires when a control like a select, checkbox, or radio commits a new value.',
          whyItExists: 'Angular uses it to know that the form state actually changed in a way that should affect bindings, payloads, or visible selections.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} and Angular needed to react to the committed control value.`,
          examples: [
            `This example: ${record.action}. Angular updated the form state after the control changed.`,
            'Another common case: checking a box fires change, then Angular updates the bound model and visible toggle state.'
          ],
          insight: 'Change is a commit-style event. It means the control settled on a value that Angular should treat as the new source of truth.'
        };
      case 'hover':
        return {
          title: 'Hover event - Lightweight visual reaction',
          subtitle: context,
          whatItIs: 'A hover event is a pointer-driven interaction that usually reveals lightweight UI like a tooltip or hover styling.',
          whyItExists: 'It lets Angular respond to user intent before a full click, which is useful for hints, previews, and subtle interface feedback.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} and Angular needed to update a lightweight hover-driven UI state.`,
          examples: [
            `This example: ${record.action}. Angular reacted without a full page-level state change.`,
            'Another common case: hovering a help icon shows a tooltip, then mouse leave hides it again.'
          ],
          insight: 'Hover should feel cheap. If a hover causes broad work, your component boundaries are probably too loose.'
        };
      case 'async':
        return {
          title: 'Async event - Work that finished later',
          subtitle: context,
          whatItIs: 'An async event happens after the original user action when a timer, observable, or overlay callback completes.',
          whyItExists: 'Angular apps regularly update after the user action has already finished, and Zone.js is what lets Angular notice those later completions automatically.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} happened after the original interaction had already moved on.`,
          examples: [
            `This example: ${record.action}. Angular reacted when later async state arrived.`,
            'Another common case: a snackbar auto-dismiss timer finishes and Angular removes it without another click.'
          ],
          insight: 'A lot of Angular feels automatic because async completions re-enter the framework without manual wiring.'
        };
      case 'overlay':
        return {
          title: 'Overlay open or close - Floating UI lifecycle',
          subtitle: context,
          whatItIs: 'Overlay events happen when dialogs, menus, snackbars, and tooltips mount or tear down outside the normal page flow.',
          whyItExists: 'Angular uses overlays for focused UI that should float above the page while still participating in change detection and lifecycle.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} changed the visibility of overlay-based UI.`,
          examples: [
            `This example: ${record.action}. Angular mounted or removed overlay UI while keeping the page context visible.`,
            'Another common case: opening a dialog creates an overlay component, and closing it destroys that component again.'
          ],
          insight: 'Overlays are some of the clearest ways to see component mount and unmount behavior in a real Angular app.'
        };
      case 'click':
        return {
          title: 'Click event - Direct pointer interaction',
          subtitle: context,
          whatItIs: 'A click event fires when the user activates an element with a pointer or keyboard-equivalent action.',
          whyItExists: 'Angular uses click handlers for navigation, toggles, buttons, and any direct action where the user expects immediate feedback.',
          whenItRuns: `Here it ran because ${record.action.toLowerCase()} and Angular needed to handle that direct action.`,
          examples: [
            `This example: ${record.action}. Angular handled the click and updated the related UI state.`,
            'Another common case: clicking pagination triggers a list update, so Angular re-evaluates the current page of rows.'
          ],
          insight: 'Click is only one event type in the story. Real Angular behavior also depends heavily on focus, blur, input, change, hover, and async completion.'
        };
      default:
        return {
          title: 'Angular concept',
          subtitle: context,
          whatItIs: 'This is a contextual Angular concept tied to the last interaction.',
          whyItExists: 'Angular uses it to keep template state and rendered output aligned.',
          whenItRuns: `It appeared here because ${record.action.toLowerCase()}.`,
          examples: [
            `This example: ${record.action}`,
            'Another example: clicking, typing, or routing can trigger the same concept in a different part of the tree.'
          ],
          insight: 'The best explanation is always tied to the specific action that caused Angular to react.'
        };
    }
  }
}
