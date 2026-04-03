import { Injectable, NgZone, signal } from '@angular/core';
import { InteractionStart } from '../models/timeline.models';
import { ChangeDetectionService } from './change-detection.service';
import { TimelineService } from './timeline.service';

@Injectable({ providedIn: 'root' })
export class ZoneTrackerService {
  readonly zoneState = signal('stable');

  constructor(
    private readonly ngZone: NgZone,
    private readonly changeDetection: ChangeDetectionService,
    private readonly timeline: TimelineService
  ) {
    this.ngZone.onUnstable.subscribe(() => this.zoneState.set('unstable'));
    this.ngZone.onStable.subscribe(() => this.zoneState.set('stable'));
  }

  beginInteraction(start: InteractionStart): void {
    this.timeline.beginInteraction(start);
    this.timeline.addStep(
      'zone',
      `Zone.js intercepted ${start.triggerType}`,
      `Angular became aware of the ${start.triggerType} through Zone.js.`
    );
    this.changeDetection.startCycle(start.reasons[0] ?? 'a user interaction reached Angular');
  }

  markObservable(title: string, detail: string): void {
    this.timeline.addStep('observable', title, detail);
  }

  markValidation(detail: string): void {
    this.timeline.addStep('validation', 'Validation executed', detail);
  }
}
