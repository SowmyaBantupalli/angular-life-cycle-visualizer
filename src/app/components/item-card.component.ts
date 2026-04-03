import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

export interface DashboardItem {
  id: number;
  name: string;
  status: 'Healthy' | 'Warning' | 'Archived';
  owner: string;
}

@Component({
  selector: 'app-item-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article class="card" [class.checked]="lifecycleTracker.isActive(componentName)">
      <div>
        <span class="badge" [attr.data-status]="item.status">{{ item.status }}</span>
        <h3>{{ item.name }}</h3>
        <p>Owned by {{ item.owner }}</p>
      </div>
      <div class="actions">
        <button type="button" (click)="edit.emit(item.id)">Edit</button>
        <button type="button" class="danger" (click)="remove.emit(item.id)">Delete</button>
      </div>
    </article>
  `,
  styles: [`
    .card {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 18px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.92);
      transition: transform 180ms ease, box-shadow 180ms ease;
    }

    .card.checked {
      transform: translateY(-2px);
      box-shadow: 0 0 0 5px rgba(12, 124, 120, 0.1);
    }

    h3,
    p {
      margin: 0;
    }

    p {
      margin-top: 6px;
      color: var(--muted);
    }

    .badge {
      display: inline-block;
      margin-bottom: 10px;
      border-radius: 999px;
      padding: 5px 10px;
      background: rgba(12, 124, 120, 0.12);
      color: var(--brand);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .badge[data-status="Warning"] {
      background: rgba(216, 111, 69, 0.14);
      color: var(--accent);
    }

    .badge[data-status="Archived"] {
      background: rgba(94, 112, 136, 0.14);
      color: var(--muted);
    }

    .actions {
      display: flex;
      gap: 10px;
      align-items: start;
    }

    button {
      border: 0;
      border-radius: 12px;
      padding: 10px 12px;
      cursor: pointer;
      background: rgba(12, 124, 120, 0.1);
      color: var(--brand);
    }

    .danger {
      background: rgba(209, 73, 91, 0.12);
      color: var(--warn);
    }
  `]
})
export class ItemCardComponent extends TrackedComponentBase {
  @Input({ required: true }) item!: DashboardItem;
  @Output() edit = new EventEmitter<number>();
  @Output() remove = new EventEmitter<number>();

  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService
  ) {
    super('ItemCardComponent', lifecycleTracker, changeDetection);
  }
}
