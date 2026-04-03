import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { delay, of, switchMap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-forms-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="forms-page" [class.checked]="lifecycleTracker.isActive(componentName)">
      <div class="intro">
        <div>
          <p class="eyebrow">Critical interaction flow</p>
          <h1>Forms make Angular's hidden work easy to explain.</h1>
          <p>Focus, type, blur, change, submit, and watch snackbar and validation behavior explain what Angular actually did.</p>
        </div>
        <div class="status">
          <span>Status</span>
          <strong>{{ form.pending ? 'Async validator running' : form.valid ? 'Ready to submit' : 'Needs attention' }}</strong>
        </div>
      </div>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          <span>Project name</span>
          <input
            formControlName="project"
            placeholder="Acme expansion portal"
            (focus)="trackFieldFocus('Project')"
            (blur)="trackFieldBlur('Project')"
            (input)="trackProjectInput($event)" />
          <small>{{ projectMessage }}</small>
        </label>

        <label>
          <span>Email</span>
          <input
            formControlName="email"
            placeholder="owner@company.com"
            (focus)="trackFieldFocus('Email')"
            (blur)="trackEmailBlur()"
            (input)="trackEmailInput($event)" />
          <small>{{ emailMessage }}</small>
        </label>

        <label>
          <span>Workspace type</span>
          <select
            formControlName="workspace"
            (focus)="trackFieldFocus('Workspace')"
            (blur)="trackFieldBlur('Workspace')"
            (change)="trackWorkspaceChange($event)">
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
            <option value="Support">Support</option>
          </select>
        </label>

        <fieldset>
          <legend>Integrations</legend>
          <label><input type="checkbox" formControlName="alerts" (focus)="trackFieldFocus('Alerts toggle')" (blur)="trackFieldBlur('Alerts toggle')" (change)="trackIntegrationToggle('Alerts', $event)" /> Alerts</label>
          <label><input type="checkbox" formControlName="analytics" (focus)="trackFieldFocus('Analytics toggle')" (blur)="trackFieldBlur('Analytics toggle')" (change)="trackIntegrationToggle('Analytics', $event)" /> Analytics</label>
        </fieldset>

        <fieldset>
          <legend>Environment</legend>
          <label><input type="radio" value="Preview" formControlName="environment" (focus)="trackFieldFocus('Preview environment')" (blur)="trackFieldBlur('Preview environment')" (change)="trackEnvironmentChange('Preview')" /> Preview</label>
          <label><input type="radio" value="Production" formControlName="environment" (focus)="trackFieldFocus('Production environment')" (blur)="trackFieldBlur('Production environment')" (change)="trackEnvironmentChange('Production')" /> Production</label>
        </fieldset>

        <button type="submit" [disabled]="form.invalid || form.pending">Submit form</button>
      </form>
    </section>
  `,
  styles: [`
    .forms-page {
      display: grid;
      gap: 18px;
    }

    .intro,
    .form {
      border: 1px solid var(--line);
      border-radius: 24px;
      padding: 24px;
      background: rgba(255, 255, 255, 0.94);
    }

    .intro {
      display: flex;
      justify-content: space-between;
      gap: 20px;
      align-items: end;
    }

    .status {
      min-width: 220px;
      padding: 16px;
      border-radius: 18px;
      background: rgba(12, 124, 120, 0.08);
    }

    .status span,
    small,
    .intro p {
      color: var(--muted);
    }

    .eyebrow {
      color: var(--brand);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .form {
      display: grid;
      gap: 18px;
    }

    label,
    fieldset {
      display: grid;
      gap: 8px;
    }

    fieldset {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
    }

    input,
    select {
      border: 1px solid rgba(19, 34, 56, 0.12);
      border-radius: 14px;
      padding: 13px 14px;
      background: white;
      transition: border-color 180ms ease, box-shadow 180ms ease;
    }

    input:focus,
    select:focus {
      outline: none;
      border-color: var(--brand);
      box-shadow: 0 0 0 4px rgba(12, 124, 120, 0.12);
    }

    button {
      width: fit-content;
      border: 0;
      border-radius: 16px;
      padding: 13px 20px;
      background: var(--brand);
      color: white;
      font-weight: 700;
      cursor: pointer;
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }

    @media (max-width: 860px) {
      .intro {
        flex-direction: column;
        align-items: start;
      }
    }
  `]
})
export class FormsPageComponent extends TrackedComponentBase {
  private readonly emailAsyncValidator = (control: AbstractControl) =>
    timer(280).pipe(
      map((): ValidationErrors | null => {
        const value = String(control.value ?? '');
        return value.endsWith('@blocked.dev') ? { blockedDomain: true } : null;
      })
    );

  readonly form = this.formBuilder.group({
    project: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email], [this.emailAsyncValidator]],
    workspace: ['Operations', Validators.required],
    alerts: [true],
    analytics: [false],
    environment: ['Preview', Validators.required]
  });

  projectMessage = 'Waiting for input.';
  emailMessage = 'Async validator has not run yet.';

  constructor(
    lifecycleTracker: LifecycleTrackerService,
    changeDetection: ChangeDetectionService,
    private readonly zoneTracker: ZoneTrackerService,
    private readonly formBuilder: FormBuilder,
    private readonly snackBar: MatSnackBar
  ) {
    super('FormComponent', lifecycleTracker, changeDetection);

    this.form.controls.email.statusChanges.subscribe((status) => {
      this.emailMessage = status === 'PENDING'
        ? 'Async validator running through an observable.'
        : status === 'VALID'
          ? 'Async validator resolved and the email can be submitted.'
          : 'Email is invalid or blocked by the async validator.';
    });
  }

  trackFieldFocus(field: string): void {
    this.zoneTracker.beginInteraction({
      action: `${field} focus`,
      component: 'FormComponent',
      triggerType: 'focus',
      reasons: [
        'A focus event entered Angular through Zone.js.',
        'Angular checked the form so active field styling could update.',
        'The field is now ready for keyboard interaction and accessibility focus flow.'
      ],
      optimization: 'Focus is a tiny UI event. Good component boundaries keep this from becoming a broader check than necessary.',
      uiChange: `${field} focus styling is now active.`
    });
    this.changeDetection.markSkipped('HeaderComponent', 'The header does not need to react when a form control gains focus.');
    this.changeDetection.markDomUpdate(`${field} focus styling is now active.`);
  }

  trackFieldBlur(field: string): void {
    this.zoneTracker.beginInteraction({
      action: `${field} blur`,
      component: 'FormComponent',
      triggerType: 'blur',
      reasons: [
        'A blur event entered Angular through Zone.js.',
        'Angular checked the form because the active field lost focus.',
        'Blur matters because touched state and field-level UI can change when focus leaves.'
      ],
      optimization: 'Blur-driven updates should stay local to the control that lost focus. OnPush boundaries keep unrelated regions out of the pass.',
      uiChange: `${field} focus styling was removed.`
    });
    this.changeDetection.markDomUpdate(`${field} focus styling was removed.`);
  }

  trackProjectInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.zoneTracker.beginInteraction({
      action: 'Project input',
      component: 'FormComponent',
      triggerType: 'input',
      reasons: [
        'An input event entered Angular through Zone.js.',
        'The reactive project control emitted valueChanges for the new text.',
        'Angular checked the form so helper text and submit state could react to the latest value.'
      ],
      optimization: 'This still uses default change detection. Smaller OnPush form regions would keep fast typing more tightly scoped.',
      uiChange: `Project helper text refreshed for ${value || 'an empty value'}.`
    });
    this.zoneTracker.markObservable('valueChanges emitted', `The project control emitted "${value || 'empty'}".`);
    this.zoneTracker.markValidation(
      value && value.length >= 3
        ? 'The required and min-length validators passed for the project field.'
        : 'The required and min-length validators ran and the project field is still invalid.'
    );
    this.projectMessage = value && value.length >= 3
      ? 'valueChanges fired, validators passed, and the form can settle.'
      : 'valueChanges fired, validators ran, and the project field still needs more input.';
    this.changeDetection.markSkipped('HeaderComponent', 'The header does not need to update for a form-only input event.');
    this.changeDetection.markDomUpdate(`Project helper text refreshed for ${value || 'an empty value'}.`);
  }

  trackEmailInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.zoneTracker.beginInteraction({
      action: 'Email input',
      component: 'FormComponent',
      triggerType: 'input',
      reasons: [
        'An input event entered Angular through Zone.js.',
        'The reactive email control emitted valueChanges for the new text.',
        'Angular checked the form so email state and validator messaging could react.'
      ],
      optimization: 'Default change detection makes email typing easy to observe, but OnPush boundaries would stop unrelated sections from joining the pass.',
      uiChange: `Email field state updated for ${value || 'an empty value'}.`
    });
    this.zoneTracker.markObservable('valueChanges emitted', `The email control emitted "${value || 'empty'}".`);
    this.zoneTracker.markValidation('Angular ran synchronous email validation and started the async blocked-domain check.');
    this.emailMessage = value ? 'Typing updates the field immediately while async validation catches up.' : 'Email is waiting for input.';
    this.changeDetection.markSkipped('ListComponent', 'The dashboard list is unrelated to email typing and can stay skipped.');
    this.changeDetection.markDomUpdate(`Email field state updated for ${value || 'an empty value'}.`);
  }

  trackEmailBlur(): void {
    this.form.controls.email.markAsTouched();
    const status = this.form.controls.email.status;
    this.zoneTracker.beginInteraction({
      action: 'Email blur',
      component: 'FormComponent',
      triggerType: 'blur',
      reasons: [
        'A blur event entered Angular through Zone.js.',
        'Angular checked the form because the email field lost focus.',
        'Blur matters here because the control becomes touched and validation UI can appear.'
      ],
      optimization: 'Blur should only update the control that lost focus. OnPush boundaries keep that touched-state update from widening across the app.',
      uiChange: `Email validation feedback was refreshed after blur with status ${status}.`
    });
    this.zoneTracker.markValidation(
      status === 'VALID'
        ? 'The email field was touched on blur and remains valid.'
        : 'The email field was touched on blur, so validation feedback can now be shown.'
    );
    this.changeDetection.markDomUpdate(`Email validation feedback was refreshed after blur with status ${status}.`);
  }

  trackWorkspaceChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.zoneTracker.beginInteraction({
      action: `User changed workspace to ${value}`,
      component: 'FormComponent',
      triggerType: 'change',
      reasons: [
        'A select change event entered Angular through Zone.js.',
        'Angular checked the reactive form bindings for the updated selection.',
        'The selected workspace now influences the submitted payload.'
      ],
      optimization: 'Select changes are small local updates. OnPush keeps unrelated screens from joining the same pass.',
      uiChange: `Workspace selection changed to ${value}.`
    });
    this.changeDetection.markDomUpdate(`Workspace selection changed to ${value}.`);
  }

  trackIntegrationToggle(name: string, event: Event): void {
    const enabled = (event.target as HTMLInputElement).checked;
    this.zoneTracker.beginInteraction({
      action: `User ${enabled ? 'enabled' : 'disabled'} ${name}`,
      component: 'FormComponent',
      triggerType: 'change',
      reasons: [
        'A checkbox change event entered Angular through Zone.js.',
        'Angular checked the form bindings for the updated toggle state.',
        'The integration selection changes the submitted payload and visible state.'
      ],
      optimization: 'Checkbox interactions are highly localized. Smaller OnPush field groups keep the work scoped to the changed options.',
      uiChange: `${name} is now ${enabled ? 'enabled' : 'disabled'}.`
    });
    this.changeDetection.markDomUpdate(`${name} is now ${enabled ? 'enabled' : 'disabled'}.`);
  }

  trackEnvironmentChange(value: string): void {
    this.zoneTracker.beginInteraction({
      action: `User selected ${value} environment`,
      component: 'FormComponent',
      triggerType: 'change',
      reasons: [
        'A radio input change event entered Angular through Zone.js.',
        'Angular checked the form bindings for the new environment value.',
        'The chosen environment affects the submission payload and visible state.'
      ],
      optimization: 'This is another narrow form interaction. OnPush field groups help keep the rest of the page out of the pass.',
      uiChange: `Environment changed to ${value}.`
    });
    this.changeDetection.markDomUpdate(`Environment changed to ${value}.`);
  }

  submit(): void {
    this.zoneTracker.beginInteraction({
      action: 'User submitted the form',
      component: 'FormComponent',
      triggerType: 'submit',
      reasons: [
        'The submit event entered Angular through ngSubmit.',
        'Angular checked the form because the submit handler ran.',
        'The simulated API observable updated submission state after the payload was accepted.'
      ],
      optimization: 'Submit flows often mix validation and async work. OnPush containers keep the response update focused on the success region instead of the entire screen.',
      uiChange: 'The form submission completed and success-facing UI became available.'
    });
    this.zoneTracker.markValidation('Angular confirmed the current form validity before proceeding with submission.');
    of(this.form.getRawValue()).pipe(
      delay(450),
      switchMap((payload) => {
        this.zoneTracker.markObservable('Submission observable emitted', `The form payload was staged for ${payload.workspace} workspace creation.`);
        return of(payload);
      })
    ).subscribe((payload) => {
      this.changeDetection.markSkipped('HeaderComponent', 'The header stayed untouched while the form submission completed.');
      const snackBarRef = this.snackBar.open(`Workspace created for ${payload.project || 'your project'}.`, 'Dismiss', {
        duration: 2200
      });
      this.zoneTracker.markObservable('Snackbar opened', 'A Material snackbar appeared as async feedback after the form submit completed.');
      this.changeDetection.markDomUpdate(`Submission completed for ${payload.project || 'an untitled project'} and a snackbar appeared.`);
      this.form.markAsPristine();

      snackBarRef.afterDismissed().subscribe(() => {
        this.zoneTracker.beginInteraction({
          action: 'Snackbar auto-dismissed after form submit',
          component: 'SnackbarOverlay',
          triggerType: 'async',
          reasons: [
            'A snackbar duration timer completed after the original submit interaction.',
            'Angular checked the overlay because the snackbar visibility changed.',
            'The snackbar was removed from the DOM without another direct user event.'
          ],
          optimization: 'Snackbars are compact async overlays. They are useful for teaching how timers re-enter Angular through Zone.js.',
          uiChange: 'The snackbar disappeared after its timer completed.'
        });
        this.changeDetection.markDomUpdate('The snackbar disappeared after its timer completed.');
      });
    });
  }
}
