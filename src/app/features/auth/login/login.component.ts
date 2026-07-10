import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthStore } from '@core/auth/auth.store';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { TuiIcon } from '@taiga-ui/core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, PhoneInputComponent, TranslatePipe, TuiIcon],
  styles: [`
    :host { display: block; }

    .auth-root {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      background: #0F2240;
    }

    /* ── BRAND PANEL ──────────────────────────────── */
    .brand {
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem 2.5rem;
      z-index: 1;
      border-top: 3px solid #C9920D;
    }

    .brand-content { position: relative; z-index: 2; }

    .brand-logo {
      width: 240px;
      object-fit: contain;
    }

    .brand-sep {
      display: block;
      width: 32px; height: 1px;
      background: rgba(255,255,255,.18);
      margin: 1.25rem auto 1rem;
    }

    .brand-tagline {
      color: rgba(241,245,249,.72);
      font-size: 1.0625rem;
      font-weight: 600;
      letter-spacing: 0.01em;
      margin: 0;
      min-height: 1.3em;
    }

    .tagline-fade {
      display: inline-block;
      animation: taglineFade .6s cubic-bezier(.22,1,.36,1);
    }

    @keyframes taglineFade {
      from { opacity: 0; transform: translateY(6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ── SPLIT DIVIDER ─────────────────────────────── */
    .split-divider {
      display: none;
      width: 1px;
      flex-shrink: 0;
      background: rgba(255,255,255,.08);
      align-self: stretch;
    }

    /* ── FORM PANEL ───────────────────────────────── */
    .form-side {
      background: #FEFDFB;
      border-radius: 1.25rem 1.25rem 0 0;
      padding: 2.25rem 1.5rem 3.5rem;
      flex: 1;
    }

    .form-inner { width: 100%; }

    .form-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0F2240;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }

    .form-sub {
      font-size: 0.875rem;
      color: #64748B;
      margin: 0 0 1.75rem;
    }

    .field-wrap { display: flex; flex-direction: column; }

    .field-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.4rem;
      letter-spacing: 0.01em;
    }

    .field-input {
      width: 100%;
      padding: 0.8125rem 1rem;
      border: 2px solid #E2E8F0;
      border-radius: 0.75rem;
      background: #F8F9FC;
      font-size: 0.9375rem;
      color: #0F172A;
      outline: none;
      font-family: inherit;
      transition: border-color .15s, background .15s, box-shadow .15s;
    }

    .field-input:focus {
      border-color: #1B4F8A;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(27,79,138,.08);
    }

    .field-input.is-error { border-color: #DC2626; }

    .field-error { font-size: 0.75rem; color: #DC2626; margin: 0.375rem 0 0; }

    .pw-wrap { position: relative; }

    .pw-toggle {
      position: absolute;
      right: 0.875rem; top: 50%;
      transform: translateY(-50%);
      background: none; border: none;
      cursor: pointer; color: #94A3B8;
      padding: 0.25rem;
      display: flex; align-items: center;
      transition: color .15s;
    }

    .pw-toggle:hover { color: #64748B; }

    .forgot-link {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1B4F8A;
      text-decoration: none;
      align-self: flex-end;
    }

    .forgot-link:hover { text-decoration: underline; }

    .submit-btn {
      width: 100%;
      padding: 0.9375rem;
      background: #1B4F8A;
      color: #fff;
      font-size: 0.9375rem;
      font-weight: 700;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      min-height: 52px;
      font-family: inherit;
      transition: background .15s;
    }

    .submit-btn:hover:not(:disabled) { background: #0D3D6E; }
    .submit-btn:disabled { opacity: .55; cursor: not-allowed; }

    .spinner {
      width: 18px; height: 18px;
      border: 2.5px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
    }

    .footer-note { text-align: center; font-size: .875rem; color: #64748B; margin-top: 1.5rem; }
    .footer-note a { color: #1B4F8A; font-weight: 700; text-decoration: none; }
    .footer-note a:hover { text-decoration: underline; }

    /* ── DESKTOP ──────────────────────────────────── */
    @media (min-width: 768px) {
      .auth-root { flex-direction: row; overflow: hidden; min-height: 100svh; }

      .brand {
        flex: 0 0 44%;
        align-items: center;
        text-align: center;
        padding: 0 3.5rem;
        min-height: 100svh;
        justify-content: center;
        border-top: none;
      }

      .brand-logo { width: 300px; }
      .brand-sep { margin: 0.625rem auto 1rem; }
      .split-divider { display: block; }

      .form-side {
        flex: 1;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100svh;
        padding: 3rem;
        overflow-y: auto;
      }

      .form-inner { max-width: 380px; width: 100%; }
    }
  `],
  template: `
    <div class="auth-root animate-fade">

      <!-- BRAND PANEL -->
      <div class="brand">
        <div class="brand-content">
          <img src="/icons/katica-logo-dark.svg" alt="Katica" class="brand-logo" />
          <span class="brand-sep"></span>
          <p class="brand-tagline">
            @for (key of [rotatorKeys[rotatorIndex()]]; track key) {
              <span class="tagline-fade">{{ key | translate }}</span>
            }
          </p>
        </div>
      </div>

      <!-- DIVIDER (desktop only) -->
      <div class="split-divider"></div>

      <!-- FORM PANEL -->
      <div class="form-side animate-card">
        <div class="form-inner">
          <p class="form-title">{{ 'auth.login.title' | translate }}</p>
          <p class="form-sub">{{ 'auth.login.subtitle' | translate }}</p>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" style="display:flex;flex-direction:column;gap:1.125rem">

            <div class="field-wrap">
              <label class="field-label">{{ 'auth.login.phone' | translate }}</label>
              <app-phone-input formControlName="phoneNumber" />
              @if (form.get('phoneNumber')?.invalid && form.get('phoneNumber')?.touched) {
                <p class="field-error">{{ 'auth.login.phoneError' | translate }}</p>
              }
            </div>

            <div class="field-wrap">
              <label class="field-label">{{ 'auth.login.password' | translate }}</label>
              <div class="pw-wrap">
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  formControlName="password"
                  placeholder="••••••••"
                  class="field-input"
                  [class.is-error]="form.get('password')?.invalid && form.get('password')?.touched"
                />
                <button type="button" class="pw-toggle"
                        (click)="showPassword.set(!showPassword())"
                        [attr.aria-label]="showPassword() ? 'Masquer' : 'Afficher'">
                  @if (showPassword()) {
                    <tui-icon icon="@tui.eye-off" class="w-5 h-5" />
                  } @else {
                    <tui-icon icon="@tui.eye" class="w-5 h-5" />
                  }
                </button>
              </div>
              @if (form.get('password')?.invalid && form.get('password')?.touched) {
                <p class="field-error">{{ 'auth.login.passwordError' | translate }}</p>
              }
            </div>

            <a routerLink="/auth/forgot-password" class="forgot-link">{{ 'auth.login.forgotPassword' | translate }}</a>

            <button type="submit" class="submit-btn" [disabled]="form.invalid || auth.loading()">
              @if (auth.loading()) {
                <tui-icon icon="@tui.loader-circle" class="w-4 h-4 animate-spin" />
                {{ 'auth.login.submitting' | translate }}
              } @else {
                {{ 'auth.login.submit' | translate }}
                <tui-icon icon="@tui.arrow-right" class="w-4 h-4" />
              }
            </button>
          </form>

          <p class="footer-note">
            {{ 'auth.login.noAccount' | translate }}
            <a routerLink="/auth/register">{{ 'auth.login.signUp' | translate }}</a>
          </p>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly auth = inject(AuthStore);
  protected readonly showPassword = signal(false);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly rotatorKeys = [
    'auth.login.features.escrow',
    'auth.login.features.protection',
    'auth.login.features.disputes',
    'auth.login.features.payout',
  ];
  protected readonly rotatorIndex = signal(0);

  constructor() {
    const id = setInterval(
      () => this.rotatorIndex.update(i => (i + 1) % this.rotatorKeys.length),
      3200,
    );
    this.destroyRef.onDestroy(() => clearInterval(id));
  }

  protected readonly form = this.fb.group({
    phoneNumber: ['', Validators.required],
    password:    ['', Validators.required],
  });

  protected onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.auth.login({
      phoneNumber: this.form.value.phoneNumber!,  // already +{dialCode}{digits}
      password:    this.form.value.password!,
    });
  }
}
