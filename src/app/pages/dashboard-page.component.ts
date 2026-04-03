import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { APP_CONFIG } from '../app.constants';
import { DeleteConfirmDialogComponent } from '../components/delete-confirm-dialog.component';
import { DashboardItem, ItemCardComponent } from '../components/item-card.component';
import { LazyAnalyticsTabComponent } from '../components/lazy-analytics-tab.component';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { MetricsService } from '../services/metrics.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    CommonModule,
    ItemCardComponent,
    LazyAnalyticsTabComponent,
    MatButtonModule,
    MatExpansionModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatTooltipModule
  ],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="dashboard">
      <section class="hero" [class.checked]="lifecycleTracker.isActive(componentName)">
        <div>
          <p class="eyebrow">Operations dashboard</p>
          <h1>Welcome back, {{ userName }}. Resize the panels or explore the Material flows.</h1>
          <p>Dialogs, tabs, menus, tooltips, accordions, and loaders now teach different Angular behaviors without turning the screen into a random component dump.</p>
        </div>
        <div class="hero-actions">
          <button
            mat-flat-button
            type="button"
            color="primary"
            matTooltip="Hover teaches lightweight UI updates; click teaches async state + loader + observable response"
            (mouseenter)="trackHover(true)"
            (mouseleave)="trackHover(false)"
            (click)="triggerLoad()">
            Run CTA and API simulation
          </button>
          <button
            mat-stroked-button
            type="button"
            [matMenuTriggerFor]="quickMenu"
            (click)="openQuickMenu()">
            Quick actions
          </button>
          <mat-menu #quickMenu="matMenu">
            <button mat-menu-item type="button" (click)="openQuickAction('Release checklist')">Release checklist</button>
            <button mat-menu-item type="button" (click)="openQuickAction('Escalation queue')">Escalation queue</button>
          </mat-menu>
        </div>
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
          <strong>{{ metrics.lastDuration() | number:'1.3-3' }} ms</strong>
          <span>Last Angular event</span>
        </article>
      </section>

      <section class="material-lab">
        <mat-tab-group (selectedTabChange)="switchTab($event.index)">
          <mat-tab label="Overview">
            <div class="tab-pad">
              <p>Switching tabs is a clean way to see view updates without destroying the entire dashboard.</p>
            </div>
          </mat-tab>
          <mat-tab label="Operations">
            <div class="tab-pad">
              <mat-accordion>
                <mat-expansion-panel (opened)="toggleAccordion('System health', true)" (closed)="toggleAccordion('System health', false)">
                  <mat-expansion-panel-header>
                    <mat-panel-title>System health</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Expansion panels are great for teaching conditional DOM visibility without rebuilding the entire page.</p>
                </mat-expansion-panel>
                <mat-expansion-panel (opened)="toggleAccordion('Team capacity', true)" (closed)="toggleAccordion('Team capacity', false)">
                  <mat-expansion-panel-header>
                    <mat-panel-title>Team capacity</mat-panel-title>
                  </mat-expansion-panel-header>
                  <p>Collapse hides content, but the containing Material component can persist instead of being recreated.</p>
                </mat-expansion-panel>
              </mat-accordion>
            </div>
          </mat-tab>
          <mat-tab label="Analytics">
            <ng-template matTabContent>
              <div class="tab-pad">
                <app-lazy-analytics-tab></app-lazy-analytics-tab>
              </div>
            </ng-template>
          </mat-tab>
        </mat-tab-group>
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

        <div class="loader-row" *ngIf="loading()">
          <mat-spinner diameter="28"></mat-spinner>
          <span>Loader visible while the simulated request is in flight.</span>
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
    .list-panel,
    .material-lab {
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

    .hero-actions {
      display: grid;
      gap: 10px;
      justify-items: end;
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
    .list-header p,
    .tab-pad p {
      color: var(--muted);
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

    .material-lab {
      display: grid;
      gap: 14px;
    }

    .tab-pad {
      padding: 16px 0 6px;
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

    .loader-row {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 16px;
      background: rgba(12, 124, 120, 0.08);
      color: var(--muted);
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

    .pagination button {
      border: 0;
      border-radius: 16px;
      padding: 13px 18px;
      cursor: pointer;
      background: var(--brand);
      color: white;
      font-weight: 700;
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

      .hero-actions {
        width: 100%;
        justify-items: start;
      }

      .stats {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class DashboardPageComponent extends TrackedComponentBase {
  readonly userName = APP_CONFIG.userName;
  readonly page = signal(1);
  readonly useTrackBy = signal(true);
  readonly loading = signal(false);
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
    private readonly zoneTracker: ZoneTrackerService,
    private readonly dialog: MatDialog,
    public readonly metrics: MetricsService
  ) {
    super('ListComponent', lifecycleTracker, changeDetection);
  }

  pagedItems(): DashboardItem[] {
    const start = (this.page() - 1) * 3;
    return this.items().slice(start, start + 3);
  }

  trackByIdentity = (_index: number, item: DashboardItem): number | DashboardItem =>
    this.useTrackBy() ? item.id : item;

  trackHover(entering: boolean): void {
    this.zoneTracker.beginInteraction({
      action: `Hero CTA ${entering ? 'hover' : 'mouse leave'}`,
      component: 'DashboardHeroComponent',
      triggerType: 'hover',
      reasons: [
        'A hover event reached Angular through Zone.js.',
        'Angular checked the hero so tooltip or hover styling could update.',
        'This is a lightweight UI change that should not pull the whole page into work.'
      ],
      optimization: 'Hover should stay extremely local. It is a good example of why not every event deserves a broad component check.',
      uiChange: `Hero tooltip ${entering ? 'became eligible to appear' : 'is no longer visible'}.`
    });
    this.changeDetection.markSkipped('ListComponent', 'The list should not participate in a hover-only hero update.');
    this.changeDetection.markDomUpdate(`Hero tooltip ${entering ? 'became eligible to appear' : 'is no longer visible'}.`);
  }

  openQuickMenu(): void {
    this.zoneTracker.beginInteraction({
      action: 'User opened the Material menu',
      component: 'DashboardHeroComponent',
      triggerType: 'click',
      reasons: [
        'A click event reached Angular through Zone.js.',
        'Angular checked the overlay trigger so the Material menu could render.',
        'Menu overlays create a focused floating view without rebuilding the whole page.'
      ],
      optimization: 'Material menus isolate overlay work nicely. The main lesson is that overlay open state should not drag unrelated content into the same pass.',
      uiChange: 'The quick actions menu opened as an overlay.'
    });
    this.changeDetection.markDomUpdate('The quick actions menu opened as an overlay.');
  }

  openQuickAction(name: string): void {
    this.zoneTracker.beginInteraction({
      action: `User chose ${name} from the menu`,
      component: 'DashboardHeroComponent',
      triggerType: 'click',
      reasons: [
        'A menu item click reached Angular through Zone.js.',
        'Angular checked the overlay and trigger because the menu selection changed visible state.',
        'Closing the menu tears down overlay content after the action is selected.'
      ],
      optimization: 'Overlay menus are useful examples of focused mount and unmount behavior that should stay separate from the full page tree.',
      uiChange: `${name} was selected and the quick actions menu closed.`
    });
    this.changeDetection.markDomUpdate(`${name} was selected and the quick actions menu closed.`);
  }

  triggerLoad(): void {
    this.zoneTracker.beginInteraction({
      action: 'User clicked the hero CTA',
      component: 'DashboardHeroComponent',
      triggerType: 'click',
      reasons: [
        'A CTA click reached Angular through Zone.js.',
        'Angular checked the dashboard hero while the simulated request was in flight.',
        'The observable response updated the stats cards when data arrived.'
      ],
      optimization: 'Async data loads are usually localized. Keeping the list and forms behind OnPush boundaries prevents a stats refresh from checking unrelated UI.',
      uiChange: 'The hero stats refreshed after the simulated API response.'
    });
    this.loading.set(true);
    this.changeDetection.markSkipped('ListComponent', 'The list section stayed untouched during the hero-only API refresh.');
    this.zoneTracker.markObservable('Loader visible', 'The progress spinner is visible while the simulated request is running.');
    this.changeDetection.markDomUpdate('The loader became visible while the simulated API request started.');
    timer(420).pipe(
      map(() => ({
        users: '15,024',
        revenue: '$84.1k',
        latency: '117ms'
      }))
    ).subscribe((stats) => {
      this.zoneTracker.beginInteraction({
        action: 'Async response completed the hero refresh',
        component: 'DashboardHeroComponent',
        triggerType: 'async',
        reasons: [
          'The simulated timer completed after the original user action.',
          'Angular checked the hero again because async state arrived through Zone.js.',
          'The loader disappeared and the stats cards were updated with the response.'
        ],
        optimization: 'Async completions should only revisit the UI that depends on the response. The spinner and stats are a focused example of that pattern.',
        uiChange: 'The loader disappeared and the hero stats were updated.'
      });
      this.zoneTracker.markObservable('Observable emitted', 'The simulated API returned updated metric cards.');
      this.loading.set(false);
      this.stats.set(stats);
      this.changeDetection.markDomUpdate('The loader disappeared and the hero stats were updated.');
    });
  }

  switchTab(index: number): void {
    const tabName = ['Overview', 'Operations', 'Analytics'][index] ?? 'Unknown';
    this.zoneTracker.beginInteraction({
      action: `User switched to ${tabName} tab`,
      component: 'TabsComponent',
      triggerType: 'change',
      reasons: [
        'A Material tab selection change reached Angular through Zone.js.',
        'Angular checked the tab group because the active view changed.',
        'Lazy tab content is only created when that tab is opened for the first time.'
      ],
      optimization: tabName === 'Analytics'
        ? 'This is the high-value case for lazy content. Angular avoids mounting the analytics panel until the user actually opens it.'
        : 'Tab switches should stay local to the tab group and not feel like a full-page redraw.',
      uiChange: `${tabName} tab content is now active.`
    });
    this.changeDetection.markDomUpdate(`${tabName} tab content is now active.`);
  }

  toggleAccordion(name: string, open: boolean): void {
    this.zoneTracker.beginInteraction({
      action: `${open ? 'Expanded' : 'Collapsed'} ${name} panel`,
      component: 'AccordionComponent',
      triggerType: 'change',
      reasons: [
        'A Material expansion panel state change reached Angular through Zone.js.',
        'Angular checked the accordion because the panel visibility changed.',
        'Expansion panels show conditional DOM changes without requiring a full page redraw.'
      ],
      optimization: 'This is a good example of targeted DOM work. The panel body changes while most of the surrounding screen stays untouched.',
      uiChange: `${name} panel ${open ? 'expanded' : 'collapsed'}.`
    });
    this.changeDetection.markDomUpdate(`${name} panel ${open ? 'expanded' : 'collapsed'}.`);
  }

  setPage(page: number): void {
    const reuseLabel = this.useTrackBy() ? 'reused existing item views with trackBy' : 'recreated list rows without trackBy';
    this.zoneTracker.beginInteraction({
      action: `User clicked pagination to page ${page}`,
      component: 'ListComponent',
      triggerType: 'click',
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
      triggerType: 'change',
      reasons: [
        'A checkbox change event reached Angular through Zone.js.',
        'Angular re-evaluated the list strategy binding.',
        'Future pagination and delete actions will now use a different identity strategy.'
      ],
      optimization: checked
        ? 'trackBy is now active, so Angular can reuse rows when item identities stay stable.'
        : 'With trackBy off, later list updates will recreate more row views and produce extra work.',
      uiChange: `trackBy comparison mode is now ${checked ? 'on' : 'off'}.`
    });
    this.useTrackBy.set(checked);
    this.changeDetection.markDomUpdate(`trackBy comparison mode is now ${checked ? 'on' : 'off'}.`);
  }

  editItem(id: number): void {
    this.zoneTracker.beginInteraction({
      action: `User clicked Edit on item ${id}`,
      component: 'ListComponent',
      triggerType: 'click',
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
    const item = this.items().find((candidate) => candidate.id === id);
    if (!item) {
      return;
    }

    this.zoneTracker.beginInteraction({
      action: `User opened delete dialog for item ${id}`,
      component: 'ListComponent',
      triggerType: 'click',
      reasons: [
        'A delete click reached Angular through Zone.js.',
        'Angular opened a Material dialog overlay for confirmation.',
        'The dialog creates a new component instance and traps focus while it is open.'
      ],
      optimization: 'Dialog overlays are isolated from the page tree, which makes them ideal for teaching focused component mount and destroy behavior.',
      uiChange: `A confirmation dialog opened for ${item.name}.`
    });

    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: { id: item.id, name: item.name },
      autoFocus: true,
      restoreFocus: true
    });

    this.changeDetection.markDomUpdate(`A confirmation dialog opened for ${item.name}.`);

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.confirmed) {
        return;
      }

      this.zoneTracker.beginInteraction({
        action: `Delete dialog confirmed removal of item ${id}`,
        component: 'ListComponent',
        triggerType: 'overlay close',
        reasons: [
          'The dialog returned a confirmed result after the user closed the overlay.',
          'Angular checked the list because the backing collection changed.',
          'Removing the item updates the rendered rows and can trigger child teardown.'
        ],
        optimization: this.useTrackBy()
          ? 'trackBy helps the remaining rows survive the delete so only the removed card truly disappears.'
          : 'Without trackBy, confirming the delete can cause extra sibling row recreation in addition to removing the target item.',
        uiChange: `Item ${id} disappeared from the list after dialog confirmation.`
      });
      this.items.update((items) => items.filter((candidate) => candidate.id !== id));
      this.changeDetection.markDomUpdate(`Item ${id} disappeared from the list after dialog confirmation.`);
    });
  }
}


