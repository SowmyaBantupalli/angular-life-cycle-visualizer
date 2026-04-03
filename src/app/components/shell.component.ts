import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="shell">
      <header class="header" [class.checked]="lifecycleTracker.isActive(componentName)">
        <div class="brand">
          <span class="logo">A</span>
          <div>
            <strong>Angular Interaction Explainer</strong>
            <small>Real UI on the left, one action explained on the right</small>
          </div>
        </div>

        <nav class="nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">Home</a>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/forms" routerLinkActive="active">Forms</a>
          <a routerLink="/settings" routerLinkActive="active">Settings</a>
        </nav>

        <div class="toolbar">
          <label class="search">
            <input [formControl]="searchControl" placeholder="Search customers, invoices, alerts" />
          </label>
          <button class="icon-button" type="button" (click)="openNotifications()">9</button>
          <div class="profile-wrap">
            <button class="profile" type="button" (click)="toggleProfile()">
              <span class="avatar">RA</span>
              <span>Raj</span>
            </button>
            <div class="dropdown" *ngIf="profileOpen">
              <button type="button" (click)="navigateTo('/settings')">Account settings</button>
              <button type="button" (click)="navigateTo('/forms')">Form center</button>
            </div>
          </div>
        </div>
      </header>

      <section class="page">
        <router-outlet></router-outlet>
      </section>

      <footer class="footer" [class.checked]="lifecycleTracker.isActive('FooterComponent')">
        <div>
          <a routerLink="/dashboard" (click)="trackFooterRoute('dashboard')">Dashboard route</a>
          <a routerLink="/forms" (click)="trackFooterRoute('forms')">Forms route</a>
          <a href="https://angular.dev" target="_blank" rel="noreferrer">External Angular docs</a>
        </div>
        <p>Internal links go through the Angular router. The external link leaves Angular after the browser handles the navigation.</p>
      </footer>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .header,
    .footer,
    .page {
      border: 1px solid var(--line);
      background: var(--panel);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      box-shadow: var(--shadow);
    }

    .header {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 20px;
      align-items: center;
      padding: 18px 22px;
      position: sticky;
      top: 0;
      z-index: 5;
    }

    .brand {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .brand small {
      display: block;
      color: var(--muted);
    }

    .logo {
      width: 42px;
      height: 42px;
      display: inline-grid;
      place-items: center;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--brand), #6cbcb6);
      color: white;
      font-weight: 800;
    }

    .nav {
      display: flex;
      gap: 12px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .nav a,
    .footer a {
      color: var(--muted);
      text-decoration: none;
      font-weight: 600;
    }

    .nav a.active {
      color: var(--brand);
    }

    .toolbar {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .search input {
      width: 280px;
      max-width: 100%;
      border-radius: 999px;
      border: 1px solid var(--line);
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.8);
    }

    .icon-button,
    .profile,
    .dropdown button {
      border: 0;
      background: var(--panel-strong);
      border-radius: 14px;
      padding: 11px 14px;
      cursor: pointer;
      color: var(--text);
    }

    .profile-wrap {
      position: relative;
    }

    .profile {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: inline-grid;
      place-items: center;
      background: rgba(216, 111, 69, 0.16);
      color: var(--accent);
      font-weight: 700;
    }

    .dropdown {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      display: grid;
      gap: 8px;
      min-width: 180px;
      padding: 10px;
      border: 1px solid var(--line);
      border-radius: 18px;
      background: var(--panel-strong);
      box-shadow: var(--shadow);
    }

    .page {
      padding: 20px;
    }

    .footer {
      display: grid;
      gap: 8px;
      padding: 18px 22px;
      color: var(--muted);
    }

    .footer div {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .checked {
      outline: 2px solid rgba(12, 124, 120, 0.35);
      box-shadow: 0 0 0 8px rgba(12, 124, 120, 0.08), var(--shadow);
      transition: box-shadow 200ms ease;
    }

    @media (max-width: 960px) {
      .header {
        grid-template-columns: 1fr;
      }

      .toolbar {
        flex-wrap: wrap;
      }

      .search input {
        width: 100%;
      }
    }
  `]
})
export class ShellComponent extends TrackedComponentBase {
  readonly searchControl = new FormControl('', { nonNullable: true });
  profileOpen = false;

  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService,
    private readonly zoneTracker: ZoneTrackerService,
    private readonly router: Router
  ) {
    super('HeaderComponent', lifecycleTracker, changeDetection);

    this.searchControl.valueChanges.pipe(debounceTime(220), distinctUntilChanged()).subscribe((value) => {
      this.zoneTracker.beginInteraction({
        action: `User typed in search: ${value || 'empty'}`,
        component: 'HeaderComponent',
        triggerType: 'DOM event (input)',
        reasons: [
          'A header input event entered Angular through Zone.js.',
          'The reactive FormControl emitted a new value.',
          'Angular checked the shell so the search UI could reflect the new term.'
        ],
        optimization: 'Debouncing already reduces churn here. Making unrelated dashboard regions OnPush keeps header typing from checking more of the tree than necessary.',
        uiChange: `Search field state updated for ${value || 'an empty query'}.`
      });
      this.zoneTracker.markObservable('Reactive search emitted', `The search control produced a debounced value of "${value || 'empty'}".`);
      this.changeDetection.markSkipped('ListComponent', 'The list view is unrelated to header search and can stay untouched with OnPush boundaries.');
      this.changeDetection.markDomUpdate(`Search field state updated and any matching suggestions could refresh for "${value || 'empty'}".`);
    });
  }

  toggleProfile(): void {
    this.zoneTracker.beginInteraction({
      action: `User ${this.profileOpen ? 'closed' : 'opened'} the profile dropdown`,
      component: 'HeaderComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A click event entered Angular through Zone.js.',
        'Angular ran change detection so the dropdown visibility binding could be re-evaluated.',
        'The header template changed because the conditional dropdown block toggled.'
      ],
      optimization: 'This is a small header-only update. Keeping feature areas like the list and forms behind OnPush boundaries prevents a header click from feeling wider than it is.',
      uiChange: `Profile menu ${this.profileOpen ? 'closed' : 'opened'} in the header.`
    });
    this.profileOpen = !this.profileOpen;
    this.changeDetection.markDomUpdate(`Profile menu ${this.profileOpen ? 'opened' : 'closed'} in the header.`);
  }

  openNotifications(): void {
    this.zoneTracker.beginInteraction({
      action: 'User clicked the notification bell',
      component: 'HeaderComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'The click event reached Angular through Zone.js.',
        'Angular checked the shell because a template event handler ran.',
        'The header badge state could update after the click.'
      ],
      optimization: 'This is another localized header interaction. OnPush keeps it from pulling unrelated content into the same pass.',
      uiChange: 'Notification indicator acknowledged the click.'
    });
    this.changeDetection.markSkipped('FormComponent', 'The forms view does not need to participate in a notification click.');
    this.changeDetection.markDomUpdate('Notification badge acknowledged the click.');
  }

  navigateTo(path: string): void {
    this.zoneTracker.beginInteraction({
      action: `User navigated to ${path}`,
      component: 'HeaderComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'A header click triggered the Angular router.',
        'Router navigation recreated the routed page component.',
        'Angular checked the shell and the new route view to mount the destination screen.'
      ],
      optimization: 'Router transitions naturally recreate route-level components. Fine-grained OnPush boundaries still help inside each page after navigation settles.',
      uiChange: `The routed view changed to ${path}.`
    });
    void this.router.navigateByUrl(path).then(() => {
      this.changeDetection.markDomUpdate(`The routed view changed to ${path}.`);
    });
  }

  trackFooterRoute(path: string): void {
    this.zoneTracker.beginInteraction({
      action: `User clicked footer link to ${path}`,
      component: 'FooterComponent',
      triggerType: 'DOM event (click)',
      reasons: [
        'The click event was handled by Angular RouterLink.',
        'The current routed component is destroyed and the new one is created.',
        'Angular checked the shell while replacing the routed outlet content.'
      ],
      optimization: 'Route changes are expected to recreate page components. The main optimization opportunity is reducing extra work inside the destination screen after it mounts.',
      uiChange: `The outlet started navigating to ${path}.`
    });
  }
}
