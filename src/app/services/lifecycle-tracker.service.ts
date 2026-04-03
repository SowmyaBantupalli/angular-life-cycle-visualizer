import { Injectable, signal } from '@angular/core';
import { TimelineService } from './timeline.service';

@Injectable({ providedIn: 'root' })
export class LifecycleTrackerService {
  readonly activeComponents = signal<string[]>([]);

  constructor(private readonly timeline: TimelineService) {}

  trackHook(component: string, hook: string, detail: string): void {
    if (!this.timeline.interactionActive()) {
      return;
    }

    this.timeline.addHook(hook);
    this.pulse(component);

    if (hook === 'ngOnDestroy') {
      this.timeline.addStep('destroy', `${component} destroyed`, detail, component);
    }
  }

  pulse(component: string): void {
    this.activeComponents.update((names) => [...new Set([...names, component])]);
    window.setTimeout(() => {
      this.activeComponents.update((names) => names.filter((name) => name !== component));
    }, 750);
  }

  isActive(component: string): boolean {
    return this.activeComponents().includes(component);
  }
}
