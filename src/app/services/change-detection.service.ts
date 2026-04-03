import { Injectable, signal } from '@angular/core';
import { LifecycleTrackerService } from './lifecycle-tracker.service';
import { MetricsService } from './metrics.service';
import { TimelineService } from './timeline.service';

@Injectable({ providedIn: 'root' })
export class ChangeDetectionService {
  readonly currentReason = signal('Idle until the next user interaction');
  readonly lastDuration = signal(0);

  private cycleStart = 0;

  constructor(
    private readonly timeline: TimelineService,
    private readonly lifecycleTracker: LifecycleTrackerService,
    private readonly metrics: MetricsService
  ) {}

  startCycle(reason: string): void {
    this.currentReason.set(reason);
    this.metrics.start();
    this.cycleStart = performance.now();
    this.timeline.addStep('cd', 'Change detection triggered', `ApplicationRef.tick() ran because ${reason}.`);
  }

  markChecked(component: string, detail: string): void {
    if (!this.timeline.interactionActive()) {
      return;
    }

    const alreadyChecked = this.timeline.record()?.componentsChecked.includes(component) ?? false;
    this.timeline.markChecked(component);
    this.lifecycleTracker.pulse(component);

    if (!alreadyChecked && this.timeline.record()?.component === component) {
      this.timeline.addStep('component', `${component} checked`, detail, component);
    }
  }

  markSkipped(component: string, detail: string): void {
    if (!this.timeline.interactionActive()) {
      return;
    }

    this.timeline.markSkipped(component);
    if (!this.timeline.record()?.steps.some((step) => step.title === `${component} skipped`)) {
      this.timeline.addStep('component', `${component} skipped`, detail, component);
    }
  }

  markDomUpdate(detail: string): void {
    const duration = this.metrics.finish();
    this.lastDuration.set(duration);
    this.timeline.addStep('dom', 'DOM updated', detail);
    this.timeline.finishInteraction(detail);
  }
}
