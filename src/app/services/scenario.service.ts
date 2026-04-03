import { Injectable } from '@angular/core';
import { TimelineService } from './timeline.service';

@Injectable({ providedIn: 'root' })
export class ScenarioService {
  constructor(private readonly timeline: TimelineService) {}

  showTypingScenario(): void {
    this.timeline.replaceComparison([
      {
        scenario: 'Typing in search or form input',
        withoutOptimization: 'Every keypress wakes the full view tree, validation runs immediately, and unrelated cards are eligible for checks.',
        withOptimization: 'Debounced streams and OnPush keep work closer to the active form controls.'
      },
      {
        scenario: 'Reactive validation',
        withoutOptimization: 'Synchronous validation feedback competes with every keystroke.',
        withOptimization: 'Async validator timing is visible and the UI updates after the observable settles.'
      }
    ]);
  }

  showPaginationScenario(): void {
    this.timeline.replaceComparison([
      {
        scenario: 'Pagination update',
        withoutOptimization: 'A new page rebuilds each list row and item child lifecycles restart.',
        withOptimization: 'trackBy preserves stable item views and only changed rows redraw.'
      },
      {
        scenario: 'Delete item',
        withoutOptimization: 'Removing a card can force broad row recreation.',
        withOptimization: 'Stable identity keeps sibling cards mounted while the removed card fires ngOnDestroy.'
      }
    ]);
  }
}
