import { Component } from '@angular/core';
import { ShellComponent } from './components/shell.component';
import { TimelinePanelComponent } from './components/timeline-panel.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, TimelinePanelComponent],
  template: `
    <main class="app-shell">
      <section class="left-panel">
        <app-shell></app-shell>
      </section>
      <aside class="right-panel">
        <app-timeline-panel></app-timeline-panel>
      </aside>
    </main>
  `,
  styles: [`
    .app-shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(360px, 42%);
      gap: 20px;
      min-height: 100vh;
      padding: 20px;
    }

    .left-panel,
    .right-panel {
      min-width: 0;
    }

    @media (max-width: 1080px) {
      .app-shell {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AppComponent {}
