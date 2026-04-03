import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  private startedAt = 0;

  readonly lastDuration = signal(0);

  start(): void {
    this.startedAt = performance.now();
  }

  finish(): number {
    if (!this.startedAt) {
      this.lastDuration.set(0);
      return 0;
    }

    const duration = performance.now() - this.startedAt;
    this.lastDuration.set(duration);
    this.startedAt = 0;
    return duration;
  }
}
