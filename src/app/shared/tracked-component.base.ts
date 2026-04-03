import {
  AfterViewChecked,
  AfterViewInit,
  Directive,
  DoCheck,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';

@Directive()
export abstract class TrackedComponentBase
  implements OnInit, OnChanges, DoCheck, AfterViewInit, AfterViewChecked, OnDestroy
{
  protected constructor(
    protected readonly componentName: string,
    protected readonly lifecycleTracker: LifecycleTrackerService,
    protected readonly changeDetection: ChangeDetectionService
  ) {}

  ngOnInit(): void {
    this.lifecycleTracker.trackHook(this.componentName, 'ngOnInit', 'Component initialized.');
  }

  ngOnChanges(changes: SimpleChanges): void {
    const changedKeys = Object.keys(changes);
    this.lifecycleTracker.trackHook(
      this.componentName,
      'ngOnChanges',
      changedKeys.length ? `Inputs changed: ${changedKeys.join(', ')}.` : 'Angular evaluated input bindings.'
    );
  }

  ngDoCheck(): void {
    this.lifecycleTracker.trackHook(this.componentName, 'ngDoCheck', 'Angular checked this component during the current cycle.');
    this.changeDetection.markChecked(this.componentName, 'Participated in the active change detection pass.');
  }

  ngAfterViewInit(): void {
    this.lifecycleTracker.trackHook(this.componentName, 'ngAfterViewInit', 'View children are available.');
  }

  ngAfterViewChecked(): void {
    this.lifecycleTracker.trackHook(this.componentName, 'ngAfterViewChecked', 'Angular finished checking the rendered view.');
  }

  ngOnDestroy(): void {
    this.lifecycleTracker.trackHook(this.componentName, 'ngOnDestroy', 'Component instance removed from the view tree.');
  }
}
