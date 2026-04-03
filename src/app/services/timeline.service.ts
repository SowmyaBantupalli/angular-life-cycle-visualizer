import { Injectable, signal } from '@angular/core';
import { InteractionRecord, InteractionStart, InteractionStep, InteractionStepKind } from '../models/timeline.models';

@Injectable({ providedIn: 'root' })
export class TimelineService {
  private current: InteractionRecord | null = null;
  private nextStepId = 1;
  private replayTimer: number | null = null;

  readonly record = signal<InteractionRecord | null>(null);
  readonly replayVisibleSteps = signal<number>(0);
  readonly interactionActive = signal(false);

  beginInteraction(start: InteractionStart): void {
    this.stopReplay();
    this.nextStepId = 1;
    this.current = {
      action: start.action,
      component: start.component,
      triggerType: start.triggerType,
      startedAtLabel: '0ms',
      steps: [],
      hooks: [],
      componentsChecked: [],
      componentsSkipped: [],
      reasons: start.reasons,
      optimization: start.optimization,
      uiChange: start.uiChange
    };
    this.record.set(this.current);
    this.replayVisibleSteps.set(0);
    this.interactionActive.set(true);
  }

  addStep(kind: InteractionStepKind, title: string, detail: string, component?: string): void {
    if (!this.current) {
      return;
    }

    const nextStep: InteractionStep = {
      id: this.nextStepId++,
      kind,
      title,
      detail,
      component
    };

    this.current = {
      ...this.current,
      steps: [...this.current.steps, nextStep]
    };
    this.record.set(this.current);
    this.replayVisibleSteps.set(this.current.steps.length);
  }

  addHook(hook: string): void {
    if (!this.current || this.current.hooks.includes(hook)) {
      return;
    }

    this.current = {
      ...this.current,
      hooks: [...this.current.hooks, hook]
    };
    this.record.set(this.current);
  }

  markChecked(component: string): void {
    if (!this.current || this.current.componentsChecked.includes(component)) {
      return;
    }

    this.current = {
      ...this.current,
      componentsChecked: [...this.current.componentsChecked, component]
    };
    this.record.set(this.current);
  }

  markSkipped(component: string): void {
    if (!this.current || this.current.componentsSkipped.includes(component)) {
      return;
    }

    this.current = {
      ...this.current,
      componentsSkipped: [...this.current.componentsSkipped, component]
    };
    this.record.set(this.current);
  }

  finishInteraction(uiChange?: string): void {
    if (!this.current) {
      return;
    }

    if (uiChange) {
      this.current = {
        ...this.current,
        uiChange
      };
      this.record.set(this.current);
    }

    this.interactionActive.set(false);
    this.replayVisibleSteps.set(this.current.steps.length);
  }

  replay(): void {
    if (!this.current?.steps.length) {
      return;
    }

    this.stopReplay();
    this.replayVisibleSteps.set(0);

    const playStep = (index: number) => {
      if (!this.current) {
        return;
      }

      this.replayVisibleSteps.set(index + 1);
      if (index < this.current.steps.length - 1) {
        this.replayTimer = window.setTimeout(() => playStep(index + 1), 340);
      }
    };

    this.replayTimer = window.setTimeout(() => playStep(0), 180);
  }

  clear(): void {
    this.stopReplay();
    this.current = null;
    this.record.set(null);
    this.replayVisibleSteps.set(0);
    this.interactionActive.set(false);
  }

  private stopReplay(): void {
    if (this.replayTimer !== null) {
      window.clearTimeout(this.replayTimer);
      this.replayTimer = null;
    }
  }
}
