import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';
import { DashboardItem, ItemCardComponent } from '../components/item-card.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [CommonModule, ItemCardComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="dashboard">
      <section class="hero" [class.checked]="lifecycleTracker.isActive(componentName)">
        <div>
          <p class="eyebrow">Operations dashboard</p>
          <h1>Welcome back, Raj. The app stays quiet until you do something.</h1>
          <p>Run the CTA, change pages, or remove an item to see one isolated Angular explanation in the inspector.</p>
        </div>
        <button type="button" (click)="triggerLoad()">Run CTA and API simulation</button>
      </section>

      <section class="stats">
        <article>
          <strong>{{ stats().users }}</strong>
          <span>Active users</span>
        </article>
        <article>
          <strong>{{ stats().revenue }}</strong>
          <span>Revenue this week</span>
        </article>
        <article>
          <strong>{{ stats().latency }}</strong>
          <span>Median API latency</span>
        </article>
      </section>

      <section class="list-panel" [class.checked]="lifecycleTracker.isActive('ListComponent')">
        <div class="list-header">
          <div>
            <h2>Customer work queue</h2>
            <p>Toggle trackBy, paginate, and delete cards to compare broad list work versus stable view reuse.</p>
          </div>
          <label class="toggle">
            <input type="checkbox" [checked]="useTrackBy()" (change)="toggleTrackBy($event)" />
            <span>Use trackBy optimization</span>
          </label>
        </div>

        <div class="list">
          <app-item-card
            *ngFor="let item of pagedItems(); trackBy: trackByIdentity"
            [item]="item"
            (edit)="editItem($event)"
            (remove)="deleteItem($event)">
          </app-item-card>
        </div>

        <div class="pagination">
          <button type="button" [class.active]="page() === 1" (click)="setPage(1)">1</button>
          <button type="button" [class.active]="page() === 2" (click)="setPage(2)">2</button>
          <button type="button" [class.active]="page() === 3" (click)="setPage(3)">3</button>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .dashboard {
      display: grid;
      gap: 18px;
    }

    .hero,
    .stats article,
    .list-panel {
      border: 1px solid var(--line);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.92);
      padding: 22px;
    }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: end;
      background:
        linear-gradient(135deg, rgba(12, 124, 120, 0.12), transparent 58%),
        rgba(255, 255, 255, 0.94);
    }

    .eyebrow {
      color: var(--brand);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.72rem;
      margin: 0 0 8px;
    }

    .hero h1,
    .list-panel h2 {
      margin: 0;
    }

    .hero p,
    .list-header p {
      color: var(--muted);
    }

    .hero button,
    .pagination button {
      border: 0;
      border-radius: 16px;
      padding: 13px 18px;
      cursor: pointer;
      background: var(--brand);
      color: white;
      font-weight: 700;
    }

    .stats {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 16px;
    }

    .stats article {
      display: grid;
      gap: 6px;
    }

    .stats strong {
      font-size: 1.7rem;
    }

    .stats span {
      color: var(--muted);
    }

    .list-panel {
      display: grid;
      gap: 16px;
      transition: box-shadow 200ms ease;
    }

    .list-panel.checked {
      box-shadow: 0 0 0 8px rgba(12, 124, 120, 0.08), var(--shadow);
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      align-items: center;
    }

    .toggle {
      display: flex;
      gap: 8px;
      align-items: center;
      color: var(--muted);
      font-weight: 600;
    }

    .list {
      display: grid;
      gap: 12px;
    }

    .pagination {
      display: flex;
      gap: 10px;
      justify-content: end;
    }

    .pagination .active {
      background: var(--accent);
    }

    @media (max-width: 860px) {
      .hero,
      .list-header {
        flex-direction: column;
        align-items: start;
      }

      .stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPageComponent extends TrackedComponentBase {
  readonly page = signal(1);
  readonly useTrackBy = signal(true);
  readonly stats = signal({
    users: '14,872',
    revenue: '$82.4k',
    latency: '128ms'
  });

  private readonly items = signal<DashboardItem[]>([
    { id: 1, name: 'Enterprise onboarding', status: 'Healthy', owner: 'Asha' },
    { id: 2, name: 'Renewal risk review', status: 'Warning', owner: 'Jordan' },
    { id: 3, name: 'Security questionnaire', status: 'Healthy', owner: 'Priya' },
    { id: 4, name: 'Billing exception', status: 'Archived', owner: 'Chris' },
    { id: 5, name: 'Migration plan', status: 'Healthy', owner: 'Morgan' },
    { id: 6, name: 'Expansion proposal', status: 'Warning', owner: 'Taylor' },
    { id: 7, name: 'Contract redlines', status: 'Healthy', owner: 'Alex' },
    { id: 8, name: 'Quarterly roadmap', status: 'Healthy', owner: 'Sam' },
    { id: 9, name: 'Support escalation', status: 'Warning', owner: 'Jamie' }
  ]);

  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService,
    private readonly zoneTracker: ZoneTrackerService
  ) {
    super('ListComponent', lifecycleTracker, changeDetection);
  }

  pagedItems(): DashboardItem[] {
    const start = (this.page() - 1) * 3;
    return this.items().slice(start, start + 3);
  }

  trackByIdentity = (_index: number, item: DashboardItem): number | DashboardItem =>
    this.useTrackBy() ? item.id : item;

  triggerLoad(): void {
    this.zoneTracker.beginInteraction({
      action: 'User clicked the hero CTA',
      component: 'DashboardHeroComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A CTA click reached Angular through Zone.js.',
        'Angular checked the dashboard hero while the simulated request was in flight.',
        'The observable response updated the stats cards when data arrived.'
      ],
      optimization: 'Async data loads are usually localized. Keeping the list and forms behind OnPush boundaries prevents a stats refresh from checking unrelated UI.',
      uiChange: 'The hero stats refreshed after the simulated API response.'
    });
    this.changeDetection.markSkipped('ListComponent', 'The list section stayed untouched during the hero-only API refresh.');
    timer(420).pipe(
      map(() => ({
        users: '15,024',
        revenue: '$84.1k',
        latency: '117ms'
      }))
    ).subscribe((stats) => {
      this.zoneTracker.markObservable('Observable emitted', 'The simulated API returned updated metric cards.');
      this.stats.set(stats);
      this.changeDetection.markDomUpdate('The hero stats cards repainted with fresh observable data.');
    });
  }

  setPage(page: number): void {
    const reuseLabel = this.useTrackBy() ? 'reused existing item views with trackBy' : 'recreated list rows without trackBy';
    this.zoneTracker.beginInteraction({
      action: `User clicked pagination to page ${page}`,
      component: 'ListComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A pagination click reached Angular through Zone.js.',
        'Angular re-evaluated the ngFor block for the new page of items.',
        this.useTrackBy()
          ? 'Stable identities let Angular reuse row views instead of rebuilding them.'
          : 'Without stable identities, Angular has to recreate more of the list view.'
      ],
      optimization: this.useTrackBy()
        ? 'trackBy is already limiting DOM churn here by preserving item identity across the page update.'
        : 'This page change is doing more work than necessary. Adding trackBy lets Angular reuse item views instead of recreating them.',
      uiChange: `The list moved to page ${page} and ${reuseLabel}.`
    });
    this.page.set(page);
    if (this.useTrackBy()) {
      this.changeDetection.markSkipped('HeaderComponent', 'The header stayed stable while the list region handled pagination.');
    }
    this.changeDetection.markDomUpdate(`The list moved to page ${page} and ${reuseLabel}.`);
  }

  toggleTrackBy(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.zoneTracker.beginInteraction({
      action: `${checked ? 'Enabled' : 'Disabled'} trackBy comparison mode`,
      component: 'ListComponent',
      triggerType: 'DOM event (change)',
      reasons: [
        'A checkbox change event reached Angular through Zone.js.',
        'Angular re-evaluated the list strategy binding.',
        'Future pagination and delete actions will now use a different identity strategy.'
      ],
      optimization: checked
        ? 'trackBy is now active, so Angular can reuse rows when item identities stay stable.'
        : 'With trackBy off, later list updates will recreate more row views and produce extra work.' ,
      uiChange: `trackBy comparison mode is now ${checked ? 'on' : 'off'}.`
    });
    this.useTrackBy.set(checked);
    this.changeDetection.markDomUpdate(`trackBy comparison mode is now ${checked ? 'on' : 'off'}.`);
  }

  editItem(id: number): void {
    this.zoneTracker.beginInteraction({
      action: `User clicked Edit on item ${id}`,
      component: 'ListComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A row action click reached Angular through Zone.js.',
        'Angular checked the list region because the button handler ran.',
        'The row could reveal editing UI without changing the rest of the page.'
      ],
      optimization: 'Row actions are good candidates for small OnPush child components so only the active row participates.',
      uiChange: `Item ${id} is ready for inline editing UI.`
    });
    this.changeDetection.markDomUpdate(`Item ${id} is ready for inline editing UI.`);
  }

  deleteItem(id: number): void {
    this.zoneTracker.beginInteraction({
      action: `User deleted item ${id}`,
      component: 'ListComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A delete click reached Angular through Zone.js.',
        'The list state mutated, so Angular re-ran the ngFor block.',
        'Removing a row changes both the rendered collection and the child component lifecycle.'
      ],
      optimization: this.useTrackBy()
        ? 'trackBy helps sibling rows survive the delete. Only the removed card needs to fire ngOnDestroy.'
        : 'Without trackBy, deleting one row can cause Angular to recreate more sibling views than necessary.',
      uiChange: `Item ${id} disappeared from the list and the remaining cards reflowed.`
    });
    this.items.update((items) => items.filter((item) => item.id !== id));
    this.changeDetection.markDomUpdate(`Item ${id} disappeared from the list and the remaining cards reflowed.`);
  }
}
