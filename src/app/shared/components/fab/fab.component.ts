import { Component, computed, inject, signal } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { TuiIcon } from '@taiga-ui/core';
import { AuthStore } from '@core/auth/auth.store';
import { ToastService } from '@core/notification/toast.service';
import { PhoneInputComponent } from '../phone-input/phone-input.component';
import { FabConfig, MilestoneCreateRequest } from '@shared/models/model';
import { injectCreateEscrowMutation } from '@features/escrow/escrow.queries';
import { detectCountry } from '../phone-input/phone-input.component';
import countryToCurrency from 'country-to-currency';

@Component({
  selector: 'app-fab',
  standalone: true,
  imports: [ReactiveFormsModule, PhoneInputComponent, TranslatePipe, TuiIcon, DecimalPipe],
  styles: [`
    /* ── FAB button ─────────────────────────────── */
    :host {
      position: fixed;
      right: 1.25rem;
      bottom: calc(4.75rem + env(safe-area-inset-bottom));
      z-index: 60; /* must be > navbar z-50 so overlay/sheet render above it */
      pointer-events: none;
    }
    @media (min-width: 768px) {
      :host { bottom: 2rem; }
    }
    .fab {
      position: relative;
      pointer-events: auto;
      display: flex; align-items: center; justify-content: center;
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .875rem; font-weight: 700;
      border: none; cursor: pointer; font-family: inherit;
      box-shadow: 0 6px 24px rgba(27,79,138,.45), 0 2px 8px rgba(0,0,0,.15);
      transition: transform .2s, box-shadow .2s, opacity .2s;
      white-space: nowrap;
    }
    .fab:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(27,79,138,.5); }
    .fab:active { transform: translateY(0); }
    /* ── Overlay ─────────────────────────────────── */
    .overlay {
      position: fixed; inset: 0; z-index: 50;
      pointer-events: auto;
      background: rgba(0,0,0,.5);
      backdrop-filter: blur(2px);
      animation: fadeIn .2s ease both;
    }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }

    /* ── Bottom sheet ────────────────────────────── */
    .sheet {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 51;
      pointer-events: auto;
      background: #fff; border-radius: 24px 24px 0 0;
      padding: 0 0 env(safe-area-inset-bottom);
      box-shadow: 0 -8px 40px rgba(0,0,0,.18);
      animation: slideUp .3s cubic-bezier(0.22,1,0.36,1) both;
      max-height: 92svh; overflow-y: auto; overscroll-behavior: contain;
    }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

    @media (min-width: 768px) {
      .sheet {
        left: 50%; right: auto;
        transform: translateX(-50%);
        width: 520px; border-radius: 24px;
        bottom: 2rem;
        max-height: 88svh;
      }
    }
    @media (min-width: 960px) {
      .sheet {
        /* center within content area, offset by sidebar width (256px) */
        left: calc(128px + 50vw);
      }
    }

    /* ── Sheet header ────────────────────────────── */
    .sheet-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: .875rem 1.25rem .625rem;
      border-bottom: 1px solid #EDF1F7;
      position: sticky; top: 0; background: #fff; z-index: 1;
      border-radius: 24px 24px 0 0;
    }
    .drag-handle {
      position: absolute; top: .5rem; left: 50%; transform: translateX(-50%);
      width: 32px; height: 3px; border-radius: 99px; background: #E2E8F0;
    }
    .sheet-title { font-size: 1rem; font-weight: 700; color: #0F2240; letter-spacing: -.01em; }
    .close-btn {
      width: 30px; height: 30px; border-radius: 8px;
      background: #EDF1F7; border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      color: #64748B; transition: background .15s; flex-shrink: 0;
    }
    .close-btn:hover { background: #E2E8F0; }

    /* ── Form ────────────────────────────────────── */
    .sheet-body { padding: .875rem 1.25rem calc(1.25rem + env(safe-area-inset-bottom)); }

    .field { margin-bottom: .875rem; }
    .label {
      display: block; font-size: .75rem; font-weight: 600;
      color: #334155; margin-bottom: .25rem;
    }
    .label-opt { color: #94A3B8; font-weight: 400; }
    .input {
      width: 100%; padding: .75rem .875rem; box-sizing: border-box;
      border: 2px solid #E2E8F0; border-radius: 10px; min-height: 48px;
      background: #F8FAFC; font-size: .9375rem; color: #0F172A;
      outline: none; font-family: inherit;
      transition: border-color .2s, box-shadow .2s, background .2s;
    }
    .input:focus { border-color: #1B4F8A; background: #fff; box-shadow: 0 0 0 3px rgba(27,79,138,.08); }
    .input.error { border-color: #DC2626; }
    .err { font-size: .6875rem; color: #DC2626; margin: .2rem 0 0; }

    /* Amount wrapper with XAF suffix */
    .amount-wrap { position: relative; display: block; width: 100%; }
    .amount-suffix {
      position: absolute; right: .875rem; top: 50%; transform: translateY(-50%);
      font-size: .75rem; font-weight: 700; color: #94A3B8; pointer-events: none;
    }
    .input-amount { width: 100%; padding-right: 3.25rem; box-sizing: border-box; }

    /* Submit */
    .submit-btn {
      width: 100%; padding: .875rem; border-radius: 12px;
      background: linear-gradient(135deg, #1B4F8A, #0D3D6E);
      color: #fff; font-size: .9375rem; font-weight: 700;
      border: none; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; gap: .5rem;
      min-height: 52px; box-shadow: 0 4px 16px rgba(27,79,138,.35);
      touch-action: manipulation;
      transition: opacity .2s, transform .15s; margin-top: .5rem;
    }
    .submit-btn:hover:not(:disabled) { opacity: .91; transform: translateY(-1px); }
    .submit-btn:disabled { opacity: .5; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,.35);
      border-top-color: #fff; border-radius: 50%;
      animation: spin .7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .hint { font-size: .6875rem; color: #94A3B8; margin: .2rem 0 0; }

    /* Mode toggle */
    .mode-toggle {
      display: grid; grid-template-columns: 1fr 1fr;
      background: #F1F5F9; border-radius: 10px; padding: 3px; gap: 2px;
    }
    .mode-btn {
      padding: .625rem .5rem; border-radius: 8px; border: none; cursor: pointer;
      font-size: .8125rem; font-weight: 600; font-family: inherit;
      min-height: 40px; touch-action: manipulation;
      transition: background .2s, color .2s, box-shadow .2s;
      color: #64748B; background: transparent;
    }
    .mode-btn.active {
      background: #fff; color: #0F2240;
      box-shadow: 0 1px 4px rgba(15,34,64,.12);
    }

    /* Milestone rows */
    .ms-row {
      display: flex; gap: .625rem; align-items: flex-start;
      background: #F8FAFC; border: 1.5px solid #E2E8F0;
      border-radius: 12px; padding: .75rem; position: relative;
    }
    .ms-row-body { flex: 1; display: flex; flex-direction: column; gap: .5rem; min-width: 0; }
    .ms-row-num {
      width: 24px; height: 24px; border-radius: 50%; background: var(--clr-primary, #1B4F8A);
      color: #fff; font-size: .6875rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 3px;
    }
    .ms-input {
      width: 100%; padding: .625rem .75rem; box-sizing: border-box;
      border: 1.5px solid #E2E8F0; border-radius: 8px;
      background: #fff; font-size: .875rem; color: #0F172A;
      outline: none; font-family: inherit; min-height: 42px;
      transition: border-color .15s;
    }
    .ms-input:focus { border-color: #1B4F8A; }
    .ms-input.error { border-color: #DC2626; }
    /* amount + deadline: always stacked (sheet is narrow on mobile) */
    .ms-row-amount { position: relative; }
    .ms-remove {
      background: none; border: none; color: #CBD5E1; cursor: pointer;
      padding: 0; flex-shrink: 0; border-radius: 8px;
      width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;
      touch-action: manipulation; transition: color .15s, background .15s; margin-top: 1px;
    }
    .ms-remove:hover { color: #DC2626; background: #FEF2F2; }

    .ms-deadline-label {
      font-size: .6875rem; font-weight: 600; color: #94A3B8;
      display: block; margin-bottom: .25rem;
    }

    .ms-add-btn {
      width: 100%; padding: .75rem;
      border: 1.5px dashed #CBD5E1; border-radius: 10px; min-height: 44px;
      background: transparent; color: #64748B; font-size: .875rem; font-weight: 600;
      cursor: pointer; font-family: inherit; display: flex; align-items: center;
      justify-content: center; gap: .5rem;
      touch-action: manipulation; transition: border-color .15s, color .15s;
    }
    .ms-add-btn:hover:not(:disabled) { border-color: #1B4F8A; color: #1B4F8A; }
    .ms-add-btn:active:not(:disabled) { background: rgba(27,79,138,.04); }
    .ms-add-btn:disabled { opacity: .4; cursor: not-allowed; }

    .ms-sum {
      display: flex; justify-content: space-between; align-items: baseline;
      flex-wrap: wrap; gap: .25rem;
      font-size: .8125rem; padding: .5rem .125rem;
    }
    .ms-sum-ok   { color: #10B981; font-weight: 700; }
    .ms-sum-warn { color: #F59E0B; font-weight: 700; }
    .ms-sum-err  { color: #DC2626; font-weight: 700; }
  `],
  template: `
    <!-- FAB button -->
    @if (fabConfig(); as cfg) {
      <button
        class="fab"
        (click)="onFabClick()"
        [attr.aria-label]="cfg.labelKey | translate"
      >
        <tui-icon icon="@tui.plus" class="w-6 h-6" />
      </button>
    }

    <!-- Overlay + Bottom sheet (new transaction) -->
    @if (sheetOpen()) {
      <div class="overlay" (click)="closeSheet()"></div>
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="sheet-header">
          <div class="drag-handle"></div>
          <span class="sheet-title">{{ 'fab.form.title' | translate }}</span>
          <button class="close-btn" (click)="closeSheet()" [attr.aria-label]="'common.close' | translate">
            <tui-icon icon="@tui.x" class="w-4 h-4" />
          </button>
        </div>

        <div class="sheet-body">
          <form [formGroup]="txForm" (ngSubmit)="submitTransaction()">

            <!-- Mode toggle -->
            <div class="field">
              <label class="label">{{ 'fab.form.mode.label' | translate }}</label>
              <div class="mode-toggle">
                <button type="button" class="mode-btn" [class.active]="mode() === 'STANDARD'"
                        (click)="setMode('STANDARD')">
                  {{ 'fab.form.mode.standard' | translate }}
                </button>
                <button type="button" class="mode-btn" [class.active]="mode() === 'FREELANCE'"
                        (click)="setMode('FREELANCE')">
                  {{ 'fab.form.mode.freelance' | translate }}
                </button>
              </div>
              <p class="hint">{{ (mode() === 'FREELANCE' ? 'fab.form.mode.freelanceHint' : 'fab.form.mode.standardHint') | translate }}</p>
            </div>

            <!-- Buyer phone -->
            <div class="field">
              <label class="label">{{ 'fab.form.buyerPhone' | translate }}</label>
              <app-phone-input formControlName="buyerPhone"
                               (countryChange)="onCountryChange($event)" />
              @if (txForm.get('buyerPhone')?.invalid && txForm.get('buyerPhone')?.touched) {
                <p class="err">{{ 'fab.form.phoneError' | translate }}</p>
              }
            </div>

            <!-- Amount -->
            <div class="field">
              <label class="label">{{ 'fab.form.amount' | translate }}</label>
              <div class="amount-wrap">
                <input type="text" inputmode="numeric" formControlName="grossAmount"
                       placeholder="Ex. 50000"
                       class="input input-amount"
                       [class.error]="txForm.get('grossAmount')?.invalid && txForm.get('grossAmount')?.touched" />
                <span class="amount-suffix">{{ currency() }}</span>
              </div>
              @if (txForm.get('grossAmount')?.errors?.['min'] && txForm.get('grossAmount')?.touched) {
                <p class="err">{{ 'fab.form.amountMin' | translate }}</p>
              }
              @if (txForm.get('grossAmount')?.errors?.['max'] && txForm.get('grossAmount')?.touched) {
                <p class="err">{{ 'fab.form.amountMax' | translate }}</p>
              }
            </div>

            <!-- Description -->
            <div class="field">
              <label class="label">{{ 'fab.form.description' | translate }} <span class="label-opt">{{ 'common.optional' | translate }}</span></label>
              <textarea formControlName="description"
                        [placeholder]="'fab.form.descriptionPh' | translate"
                        class="input" rows="2"
                        style="resize:vertical; min-height:52px"></textarea>
              <p class="hint">{{ 'fab.form.maxChars' | translate }}</p>
            </div>

            <!-- Deadline — STANDARD only -->
            @if (mode() === 'STANDARD') {
              <div class="field">
                <label class="label">{{ 'fab.form.deadline' | translate }} <span class="label-opt">{{ 'common.optional' | translate }}</span></label>
                <input type="datetime-local" formControlName="deliveryDeadline"
                       class="input" />
                <p class="hint">{{ 'fab.form.deadlineHint' | translate }}</p>
              </div>
            }

            <!-- Milestones — FREELANCE only -->
            @if (mode() === 'FREELANCE') {
              <div class="field">
                <label class="label">{{ 'fab.form.milestone.label' | translate }}</label>

                <div style="display:flex;flex-direction:column;gap:.625rem;margin-bottom:.625rem">
                  @for (mg of milestones.controls; track $index; let i = $index) {
                    <div class="ms-row" [formGroup]="getMilestoneGroup(i)">
                      <span class="ms-row-num">{{ i + 1 }}</span>
                      <div class="ms-row-body">
                        <!-- Title -->
                        <input type="text" formControlName="title"
                               [placeholder]="'fab.form.milestone.titlePh' | translate"
                               class="ms-input"
                               [class.error]="getMilestoneGroup(i).get('title')?.invalid && getMilestoneGroup(i).get('title')?.touched" />
                        <!-- Amount -->
                        <div class="ms-row-amount">
                          <input type="text" inputmode="numeric" formControlName="amount"
                                 placeholder="Ex. 25000"
                                 class="ms-input input-amount"
                                 [class.error]="getMilestoneGroup(i).get('amount')?.invalid && getMilestoneGroup(i).get('amount')?.touched" />
                          <span class="amount-suffix" style="font-size:.6875rem">{{ currency() }}</span>
                        </div>
                        <!-- Deadline (optional, full-width stacked) -->
                        <div>
                          <span class="ms-deadline-label">{{ 'fab.form.milestone.deadlinePh' | translate }}</span>
                          <input type="datetime-local" formControlName="deadline" class="ms-input" />
                        </div>
                      </div>
                      @if (milestones.length > 2) {
                        <button type="button" class="ms-remove" (click)="removeMilestone(i)"
                                [attr.aria-label]="'fab.form.milestone.remove' | translate">
                          <tui-icon icon="@tui.x" class="w-4 h-4" />
                        </button>
                      }
                    </div>
                  }
                </div>

                <!-- Sum indicator -->
                <div class="ms-sum">
                  <span style="color:#64748B">{{ 'fab.form.milestone.sum' | translate }}</span>
                  <span [class.ms-sum-ok]="milestoneSumOk()"
                        [class.ms-sum-warn]="!milestoneSumOk() && milestoneSum() > 0"
                        [class.ms-sum-err]="milestoneSum() === 0">
                    {{ milestoneSum() | number }} / {{ txForm.get('grossAmount')?.value || 0 | number }} {{ currency() }}
                  </span>
                </div>
                @if (!milestoneSumOk() && txForm.get('grossAmount')?.value) {
                  <p class="err" style="margin-bottom:.5rem">{{ 'fab.form.milestone.sumError' | translate }}</p>
                }

                <button type="button" class="ms-add-btn"
                        (click)="addMilestone()" [disabled]="milestones.length >= 10">
                  <tui-icon icon="@tui.plus" class="w-4 h-4" />
                  {{ 'fab.form.milestone.add' | translate }}
                </button>
              </div>
            }

            <button type="submit" class="submit-btn"
                    [disabled]="isSubmitDisabled()">
              @if (createMutation.isPending()) {
                <span class="spinner"></span> {{ 'fab.form.submitting' | translate }}
              } @else {
                {{ 'fab.form.submit' | translate }}
                <tui-icon icon="@tui.arrow-right" class="w-4 h-4" />
              }
            </button>
          </form>
        </div>
      </div>
    }
  `,
})
export class FabComponent {
  private readonly router    = inject(Router);
  private readonly fb        = inject(FormBuilder);
  private readonly toast     = inject(ToastService);
  private readonly translate = inject(TranslateService);
  private readonly auth      = inject(AuthStore);

  protected readonly createMutation = injectCreateEscrowMutation();

  /* ── Route detection ─────────────────────────── */
  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
  );

  private static readonly FAB_ROUTES: Array<{ pattern: RegExp; config: FabConfig }> = [
    {
      pattern: /^\/(dashboard|escrow)(\/?)(\?.*)?$/,
      config: { labelKey: 'fab.newTransaction', action: 'escrow' },
    },
  ];

  protected readonly fabConfig = computed<FabConfig | null>(() => {
    if (!this.auth.isAuthenticated()) return null;
    const url = this.currentUrl() ?? '';
    const match = FabComponent.FAB_ROUTES.find(r => r.pattern.test(url));
    return match?.config ?? null;
  });

  /* ── Sheet state ─────────────────────────────── */
  protected readonly sheetOpen = signal(false);
  protected readonly mode      = signal<'STANDARD' | 'FREELANCE'>('STANDARD');
  protected readonly currency  = signal(
    (countryToCurrency as Record<string, string>)[detectCountry().code] ?? 'XAF',
  );

  protected onCountryChange(code: string): void {
    this.currency.set((countryToCurrency as Record<string, string>)[code] ?? 'XAF');
  }

  protected setMode(m: 'STANDARD' | 'FREELANCE'): void {
    this.mode.set(m);
    if (m === 'FREELANCE' && this.milestones.length === 0) {
      this.addMilestone();
      this.addMilestone();
    }
  }

  /* ── Transaction form ────────────────────────── */
  protected readonly txForm = this.fb.group({
    buyerPhone:       ['', Validators.required],
    grossAmount:      [null as number | null, [Validators.required, Validators.min(25), Validators.max(10_000_000)]],
    description:      [''],
    deliveryDeadline: [''],
    milestones:       this.fb.array<ReturnType<typeof this.buildMilestoneGroup>>([]),
  });

  get milestones(): FormArray { return this.txForm.get('milestones') as FormArray; }

  private buildMilestoneGroup() {
    return this.fb.group({
      title:    ['', [Validators.required, Validators.maxLength(200)]],
      amount:   [null as number | null, [Validators.required, Validators.min(25)]],
      deadline: [''],
    });
  }

  protected getMilestoneGroup(i: number) {
    return this.milestones.at(i) as ReturnType<typeof this.buildMilestoneGroup>;
  }

  protected addMilestone(): void {
    if (this.milestones.length < 10) this.milestones.push(this.buildMilestoneGroup());
  }

  protected removeMilestone(i: number): void {
    if (this.milestones.length > 2) this.milestones.removeAt(i);
  }

  protected milestoneSum(): number {
    return this.milestones.controls.reduce((sum, c) => sum + (+(c.get('amount')?.value as number ?? 0) || 0), 0);
  }

  protected milestoneSumOk(): boolean {
    const gross = this.txForm.get('grossAmount')?.value ?? 0;
    return !!gross && this.milestoneSum() === +gross;
  }

  protected isSubmitDisabled(): boolean {
    if (this.createMutation.isPending()) return true;
    if (this.txForm.invalid) return true;
    if (this.mode() === 'FREELANCE') {
      if (this.milestones.length < 2) return true;
      if (!this.milestoneSumOk()) return true;
      if (this.milestones.controls.some(c => c.invalid)) return true;
    }
    return false;
  }

  /* ── Actions ─────────────────────────────────── */
  protected onFabClick(): void {
    this.sheetOpen.set(true);
  }

  protected closeSheet(): void {
    this.sheetOpen.set(false);
    this.txForm.reset();
    this.milestones.clear();
    this.mode.set('STANDARD');
  }

  protected submitTransaction(): void {
    if (this.isSubmitDisabled()) { this.txForm.markAllAsTouched(); return; }
    const v = this.txForm.value;

    const milestonePayload: MilestoneCreateRequest[] | undefined =
      this.mode() === 'FREELANCE'
        ? this.milestones.controls.map(c => ({
            title:    c.get('title')!.value as string,
            amount:   Math.floor(+(c.get('amount')!.value ?? 0)),
            deadline: c.get('deadline')?.value
              ? new Date(c.get('deadline')!.value as string).toISOString()
              : undefined,
          }))
        : undefined;

    this.createMutation.mutate(
      {
        buyerPhone:       v.buyerPhone!,
        grossAmount:      Math.floor(v.grossAmount!),
        description:      v.description || undefined,
        deliveryDeadline: this.mode() === 'STANDARD' && v.deliveryDeadline
          ? new Date(v.deliveryDeadline).toISOString()
          : undefined,
        idempotencyKey:   crypto.randomUUID(),
        mode:             this.mode(),
        milestones:       milestonePayload,
      },
      {
        onSuccess: (tx) => {
          this.toast.success(this.translate.instant('toast.transactionCreated'));
          this.closeSheet();
          void this.router.navigate(['/escrow', tx.id]);
        },
      },
    );
  }
}
