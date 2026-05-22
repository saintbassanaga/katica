import { Component, inject, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { PhoneInputComponent } from '@shared/components/phone-input/phone-input.component';
import { TranslatePipe } from '@ngx-translate/core';
import { TuiIcon } from '@taiga-ui/core';
import { RouterLink } from '@angular/router';
import { injectBalanceQuery, injectCreatePayoutMutation } from '../payout.queries';

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000];

@Component({
  selector: 'app-payout-new',
  standalone: true,
  imports: [ReactiveFormsModule, AmountPipe, PhoneInputComponent, TranslatePipe, TuiIcon, RouterLink],
  template: `
    <div class="animate-fade">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <a routerLink="/wallet"
           class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/80 no-underline shrink-0 transition-colors hover:bg-white/20">
          <tui-icon icon="@tui.arrow-left" class="w-[18px] h-[18px]" />
        </a>
        <h1 class="text-sm font-bold text-white m-0 flex-1">{{ 'payouts.title' | translate }}</h1>
      </div>

    <div class="px-4 py-6 pb-24 max-w-sm mx-auto">

      @if (balance() !== null) {
        <div class="animate-entry bg-primary-lt rounded-2xl p-4 mb-6">
          <p class="text-xs text-primary font-medium mb-1">{{ 'payouts.balance' | translate }}</p>
          <p class="text-2xl font-bold text-primary">{{ balance()! | amount }}</p>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="animate-entry space-y-5">

        <!-- Amount -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">{{ 'payouts.amount' | translate }}</label>
          <div class="flex gap-2 mb-3 flex-wrap">
            @for (amount of quickAmounts; track amount) {
              <button
                type="button"
                (click)="setAmount(amount)"
                class="px-3 py-2 border rounded-xl text-sm font-medium transition-colors"
                [class.bg-primary]="form.get('amount')?.value === amount"
                [class.text-white]="form.get('amount')?.value === amount"
                [class.border-primary]="form.get('amount')?.value === amount"
                [class.border-slate-200]="form.get('amount')?.value !== amount"
                [class.text-slate-600]="form.get('amount')?.value !== amount"
              >
                {{ amount | amount }}
              </button>
            }
            @if (balance() !== null) {
              <button
                type="button"
                (click)="setAmount(balance()!)"
                class="px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium text-slate-600"
              >
                {{ 'payouts.allAmount' | translate }}
              </button>
            }
          </div>
          <div class="relative">
            <input
              type="text"
              inputmode="numeric"
              formControlName="amount"
              [placeholder]="'payouts.amountPh' | translate"
              class="w-full px-4 py-[.8125rem] pr-14 border-2 border-slate-200 rounded-xl bg-slate-50 text-[.9375rem] text-slate-900 outline-none font-[inherit] transition-all focus:border-primary focus:bg-white focus:shadow-[0_0_0_3px_rgba(27,79,138,.08)]"
              [class.border-red-500]="form.get('amount')?.invalid && form.get('amount')?.touched"
            />
            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">{{ currency() }}</span>
          </div>
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-2">{{ 'payouts.receiptNumber' | translate }}</label>
          <app-phone-input formControlName="phone" />
        </div>

        <!-- Fee preview -->
        @if (form.get('amount')?.value! > 0) {
          <div class="bg-slate-50 rounded-xl p-4 text-sm">
            <div class="flex justify-between text-slate-500 mb-1">
              <span>{{ 'payouts.estimatedFee' | translate }}</span>
              <span>{{ estimatedFee() | amount }}</span>
            </div>
            <div class="flex justify-between font-semibold text-slate-900">
              <span>{{ 'payouts.net' | translate }}</span>
              <span class="text-green-600">{{ netAmount() | amount }}</span>
            </div>
          </div>
        }

        <button
          type="submit"
          [disabled]="form.invalid || createMutation.isPending()"
          class="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm
                 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-11
                 flex items-center justify-center gap-2"
        >
          @if (createMutation.isPending()) {
            <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          }
          {{ 'payouts.continue' | translate }}
        </button>
      </form>
    </div>
    </div>
  `,
})
export class PayoutNewComponent {
  private readonly router = inject(Router);
  private readonly fb    = inject(FormBuilder);

  protected readonly balanceQuery    = injectBalanceQuery();
  protected readonly createMutation  = injectCreatePayoutMutation();
  protected readonly quickAmounts    = QUICK_AMOUNTS;

  protected readonly balance  = computed(() => this.balanceQuery.data()?.balance ?? null);
  protected readonly currency = computed(() => this.balanceQuery.data()?.currency ?? 'XAF');

  protected readonly form = this.fb.group({
    amount: [null as number | null, [Validators.required, Validators.min(500)]],
    phone: ['', Validators.required],
  });

  protected setAmount(amount: number): void {
    this.form.patchValue({ amount });
  }

  protected estimatedFee(): number {
    const amount = this.form.get('amount')?.value ?? 0;
    return Math.ceil(amount * 0.005);
  }

  protected netAmount(): number {
    const amount = this.form.get('amount')?.value ?? 0;
    return amount - this.estimatedFee();
  }

  protected onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.value;
    this.createMutation.mutate(
      { amount: v.amount!, destinationPhone: v.phone! },
      {
        onSuccess: (res) => {
          if (res?.id) this.router.navigate(['/payouts', res.id, 'otp'], { state: { status: res.status } });
        },
      },
    );
  }
}
