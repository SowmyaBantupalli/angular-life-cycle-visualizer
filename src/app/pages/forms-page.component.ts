import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { debounceTime, delay, distinctUntilChanged, of, switchMap, timer } from 'rxjs';
import { map } from 'rxjs/operators';
import { ChangeDetectionService } from '../services/change-detection.service';
import { LifecycleTrackerService } from '../services/lifecycle-tracker.service';
import { ZoneTrackerService } from '../services/zone-tracker.service';
import { TrackedComponentBase } from '../shared/tracked-component.base';

@Component({
  selector: 'app-forms-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <section class="forms-page" [class.checked]="lifecycleTracker.isActive(componentName)">
      <div class="intro">
        <div>
          <p class="eyebrow">Critical interaction flow</p>
          <h1>Forms make Angular's hidden work easy to explain.</h1>
          <p>Type into the fields, change options, and submit. The inspector stays quiet until you act, then breaks down that one interaction.</p>
        </div>
        <div class="status">
          <span>Status</span>
          <strong>{{ form.pending ? 'Async validator running' : form.valid ? 'Ready to submit' : 'Needs attention' }}</strong>
        </div>
      </div>

      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <label>
          <span>Project name</span>
          <input formControlName="project" placeholder="Acme expansion portal" />
          <small>{{ projectMessage }}</small>
        </label>

        <label>
          <span>Email</span>
          <input formControlName="email" placeholder="owner@company.com" />
          <small>{{ emailMessage }}</small>
        </label>

        <label>
          <span>Workspace type</span>
          <select formControlName="workspace" (change)="trackWorkspaceChange($event)">
            <option value="Operations">Operations</option>
            <option value="Finance">Finance</option>
            <option value="Support">Support</option>
          </select>
        </label>

        <fieldset>
          <legend>Integrations</legend>
          <label><input type="checkbox" formControlName="alerts" (change)="trackIntegrationToggle('Alerts', $event)" /> Alerts</label>
          <label><input type="checkbox" formControlName="analytics" (change)="trackIntegrationToggle('Analytics', $event)" /> Analytics</label>
        </fieldset>

        <fieldset>
          <legend>Environment</legend>
          <label><input type="radio" value="Preview" formControlName="environment" (change)="trackEnvironmentChange('Preview')" /> Preview</label>
          <label><input type="radio" value="Production" formControlName="environment" (change)="trackEnvironmentChange('Production')" /> Production</label>
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
    private readonly formBuilder: FormBuilder
  ) {
    super('FormComponent', lifecycleTracker, changeDetection);

    this.form.controls.project.valueChanges.pipe(
      debounceTime(120),
      distinctUntilChanged()
    ).subscribe((value) => {
      this.zoneTracker.beginInteraction({
        action: `User typed in Project field: ${value || 'empty'}`,
        component: 'FormComponent',
        triggerType: 'DOM event (input)',
        reasons: [
          'A DOM input event entered Angular through Zone.js.',
          'The reactive form control emitted valueChanges for the project field.',
          'Angular checked the form so helper text and submit state could be recalculated.'
        ],
        optimization: 'This interaction currently checks the form using the default strategy. Splitting dense form regions into smaller OnPush sections can localize the work.',
        uiChange: `Project helper text refreshed for ${value || 'an empty value'}.`
      });
      this.zoneTracker.markObservable('valueChanges emitted', `The project control emitted "${value || 'empty'}".`);
      this.zoneTracker.markValidation(value && value.length >= 3
        ? 'The required and min-length validators passed for the project field.'
        : 'The required and min-length validators ran and the field is still invalid.');
      this.projectMessage = value && value.length >= 3
        ? 'valueChanges fired, validators passed, and the form can settle.'
        : 'valueChanges fired, validators ran, and the project field still needs more input.';
      this.changeDetection.markSkipped('HeaderComponent', 'The header does not need to update for a form-only input event.');
      this.changeDetection.markDomUpdate(`Project helper text refreshed for ${value || 'an empty value'}.`);
    });

    this.form.controls.email.valueChanges.pipe(
      debounceTime(120),
      distinctUntilChanged()
    ).subscribe((value) => {
      this.zoneTracker.beginInteraction({
        action: `User typed in Email field: ${value || 'empty'}`,
        component: 'FormComponent',
        triggerType: 'DOM event (input)',
        reasons: [
          'A DOM input event entered Angular through Zone.js.',
          'The reactive email control emitted valueChanges.',
          'Angular checked the form so validation and error messaging could update.'
        ],
        optimization: 'Default change detection is fine for learning, but OnPush boundaries can stop email typing from checking unrelated feature areas.',
        uiChange: `Email state updated for ${value || 'an empty value'}.`
      });
      this.zoneTracker.markObservable('valueChanges emitted', `The email control emitted "${value || 'empty'}".`);
      this.zoneTracker.markValidation('Angular ran synchronous email validation and kicked off the async blocked-domain validator.');
      this.changeDetection.markSkipped('ListComponent', 'The dashboard list is unrelated to email typing and can stay skipped.');
    });

    this.form.controls.email.statusChanges.subscribe((status) => {
      if (!this.zoneTracker.zoneState) {
        return;
      }

      this.emailMessage = status === 'PENDING'
        ? 'Async validator running through an observable.'
        : status === 'VALID'
          ? 'Async validator resolved and the email can be submitted.'
          : 'Email is invalid or blocked by the async validator.';

      if (status === 'PENDING') {
        this.zoneTracker.markObservable('Async validator started', 'Angular subscribed to the blocked-domain validator observable.');
        return;
      }

      this.zoneTracker.markValidation(
        status === 'VALID'
          ? 'The async validator completed and the email passed.'
          : 'The async validator completed and the email remains invalid or blocked.'
      );
      this.changeDetection.markDomUpdate(`Email helper text refreshed after status ${status}.`);
    });
  }

  trackWorkspaceChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.zoneTracker.beginInteraction({
      action: `User changed workspace to ${value}`,
      component: 'FormComponent',
      triggerType: 'DOM event (change)',
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
      triggerType: 'DOM event (change)',
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
      triggerType: 'DOM event (change)',
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
      triggerType: 'DOM event (submit)',
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
      this.changeDetection.markDomUpdate(`Submission completed for ${payload.project || 'an untitled project'}.`);
      this.form.markAsPristine();
    });
  }
}
