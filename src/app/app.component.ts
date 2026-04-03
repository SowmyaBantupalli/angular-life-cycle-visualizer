import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, HostListener, ViewChild, signal } from '@angular/core';
import { ShellComponent } from './components/shell.component';
import { TimelinePanelComponent } from './components/timeline-panel.component';

const PANEL_WIDTH_KEY = 'panelWidth';
const MIN_LEFT_PERCENT = 30;
const MAX_LEFT_PERCENT = 70;
const DEFAULT_LEFT_PERCENT = 50;

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ShellComponent, TimelinePanelComponent],
  template: `
    <main class="app-shell" #splitRoot>
      <section class="left-panel" [style.width.%]="leftWidth()">
        <app-shell></app-shell>
      </section>

      <button
        type="button"
        class="divider"
        aria-label="Resize panels"
        [class.dragging]="dragging()"
        (mousedown)="startResize($event)"
        (dblclick)="resetPanels()">
        <span></span>
      </button>

      <aside class="right-panel" [style.width.%]="100 - leftWidth()">
        <app-timeline-panel></app-timeline-panel>
      </aside>
    </main>
  `,
  styles: [`
    .app-shell {
      display: flex;
      gap: 0;
      min-height: 100vh;
      padding: 20px;
      align-items: stretch;
    }

    .left-panel,
    .right-panel {
      min-width: 0;
      transition: width 140ms ease;
    }

    .divider {
      width: 18px;
      min-width: 18px;
      margin: 0 10px;
      padding: 0;
      border: 0;
      background: transparent;
      cursor: col-resize;
      position: relative;
    }

    .divider span {
      position: absolute;
      top: 0;
      bottom: 0;
      left: 50%;
      width: 4px;
      transform: translateX(-50%);
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(12, 124, 120, 0.18), rgba(216, 111, 69, 0.18));
      box-shadow: 0 0 0 1px rgba(12, 124, 120, 0.12);
      transition: box-shadow 150ms ease, background 150ms ease;
    }

    .divider:hover span,
    .divider.dragging span {
      background: linear-gradient(180deg, rgba(12, 124, 120, 0.5), rgba(216, 111, 69, 0.48));
      box-shadow: 0 0 0 6px rgba(12, 124, 120, 0.12);
    }

    .divider.dragging {
      cursor: col-resize;
    }

    @media (max-width: 1080px) {
      .app-shell {
        display: grid;
        grid-template-columns: 1fr;
        gap: 20px;
      }

      .left-panel,
      .right-panel {
        width: auto !important;
      }

      .divider {
        display: none;
      }
    }
  `]
})
export class AppComponent implements AfterViewInit {
  @ViewChild('splitRoot') private splitRoot?: ElementRef<HTMLElement>;

  readonly leftWidth = signal(DEFAULT_LEFT_PERCENT);
  readonly dragging = signal(false);

  ngAfterViewInit(): void {
    const saved = Number(localStorage.getItem(PANEL_WIDTH_KEY));
    if (!Number.isNaN(saved) && saved >= MIN_LEFT_PERCENT && saved <= MAX_LEFT_PERCENT) {
      this.leftWidth.set(saved);
    }
  }

  startResize(event: MouseEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  resetPanels(): void {
    this.leftWidth.set(DEFAULT_LEFT_PERCENT);
    localStorage.setItem(PANEL_WIDTH_KEY, String(DEFAULT_LEFT_PERCENT));
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.dragging() || !this.splitRoot) {
      return;
    }

    const bounds = this.splitRoot.nativeElement.getBoundingClientRect();
    const rawPercent = ((event.clientX - bounds.left) / bounds.width) * 100;
    const bounded = Math.min(MAX_LEFT_PERCENT, Math.max(MIN_LEFT_PERCENT, rawPercent));
    this.leftWidth.set(Number(bounded.toFixed(1)));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (!this.dragging()) {
      return;
    }

    this.dragging.set(false);
    localStorage.setItem(PANEL_WIDTH_KEY, String(this.leftWidth()));
  }
}
