import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class MetricsService {
  readonly lastDuration = signal(0);

  record(duration: number): number {
    const normalized = Math.max(duration, 0.01);
    this.lastDuration.set(normalized);
    return normalized;
  }

  clear(): void {
    this.lastDuration.set(0);
  }
}
