import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { injectAdminDashboardQuery, injectAdminDisputesQuery } from '../admin.queries';
import { AuthStore } from '@core/auth/auth.store';
import { StatusBadgeComponent } from '@shared/components/status-badge/status-badge.component';
import { TimeAgoPipe } from '@shared/pipes/time-ago.pipe';
import { AmountPipe } from '@shared/pipes/amount.pipe';
import { TuiIcon } from '@taiga-ui/core';
import { AdminChartsComponent } from '../charts/admin-charts.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe, TranslatePipe, StatusBadgeComponent, TimeAgoPipe, AmountPipe, TuiIcon, AdminChartsComponent],
  styles: [`
    .kpi-card { background: #fff; border-radius: 16px; box-shadow: 0 2px 8px rgba(15,34,64,.07); border: 1px solid #E8EDF5; padding: 16px; }
    @media (min-width: 768px) { .kpi-card { padding: 20px; } }
    .queue-item:hover .queue-arrow { transform: translateX(3px); }
  `],
  template: `
    <div class="flex flex-col min-h-screen bg-[#EEF2F8]">

      <!-- Topbar -->
      <div class="sticky top-0 z-20 bg-dark shadow-[0_2px_12px_rgba(15,23,42,.25)] px-4 md:px-8 py-3 flex items-center gap-3">
        <div class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center shrink-0">
          <tui-icon icon="@tui.shield-check" class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1 min-w-0">
          <h1 class="text-sm font-bold text-white m-0">{{ 'admin.dashboard.console' | translate }}</h1>
          <p class="text-xs text-white/50 m-0">{{ 'admin.dashboard.heroTitle' | translate }}</p>
        </div>
        <div class="flex items-center gap-1.5">
          @if (isAdmin()) {
            <a routerLink="/admin/users"
               class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/70 no-underline transition-colors hover:bg-white/20"
               [title]="'admin.users.title' | translate">
              <tui-icon icon="@tui.users" class="w-[18px] h-[18px]" />
            </a>
            <a routerLink="/admin/transactions"
               class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/70 no-underline transition-colors hover:bg-white/20"
               [title]="'admin.transactions.title' | translate">
              <tui-icon icon="@tui.credit-card" class="w-4.5 h-4.5" />
            </a>
          }
          <a routerLink="/admin/disputes"
             class="w-9 h-9 rounded-[10px] bg-white/10 flex items-center justify-center text-white/70 no-underline transition-colors hover:bg-white/20"
             [title]="'admin.dashboard.allDisputes' | translate">
            <tui-icon icon="@tui.scale" class="w-4.5 h-4.5" />
          </a>
        </div>
      </div>

      <div class="p-4 md:p-6 flex flex-col gap-4">

        @if (isAdmin() && statsQuery.data(); as stats) {

          <!-- Row 1: Dispute KPI cards — 2×2 on mobile, 4 in a row on md+ -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-3">

            <!-- Open Disputes -->
            <div class="kpi-card">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-[10px] bg-red-50 flex items-center justify-center shrink-0">
                    <tui-icon icon="@tui.triangle-alert" class="w-4 h-4 text-red-600" />
                  </div>
                  <span class="text-[11px] font-semibold text-slate-500 leading-tight">{{ 'admin.dashboard.openDisputes' | translate }}</span>
                </div>
                @if (stats.openDisputes > 0) {
                  <span class="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 whitespace-nowrap shrink-0 ml-1">
                    {{ 'admin.dashboard.urgentBadge' | translate }}
                  </span>
                }
              </div>
              <p class="text-3xl md:text-[38px] font-black text-slate-900 m-0 leading-none">{{ stats.openDisputes }}</p>
              <p class="text-[11px] text-slate-400 mt-2 m-0">{{ 'admin.dashboard.outOfTotal' | translate:{ total: stats.totalDisputes } }}</p>
            </div>

            <!-- Under Review -->
            <div class="kpi-card">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0">
                  <tui-icon icon="@tui.search" class="w-4 h-4 text-indigo-600" />
                </div>
                <span class="text-[11px] font-semibold text-slate-500 leading-tight">{{ 'admin.dashboard.underReview' | translate }}</span>
              </div>
              <p class="text-3xl md:text-[38px] font-black text-slate-900 m-0 leading-none">{{ stats.underReviewDisputes }}</p>
              <p class="text-[11px] text-slate-400 mt-2 m-0">{{ 'admin.dashboard.analysis' | translate }}</p>
            </div>

            <!-- Arbitration -->
            <div class="kpi-card">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-[10px] bg-violet-50 flex items-center justify-center shrink-0">
                  <tui-icon icon="@tui.scale" class="w-4 h-4 text-violet-600" />
                </div>
                <span class="text-[11px] font-semibold text-slate-500 leading-tight">{{ 'admin.dashboard.arbitration' | translate }}</span>
              </div>
              <p class="text-3xl md:text-[38px] font-black text-slate-900 m-0 leading-none">{{ stats.referredToArbitrationDisputes }}</p>
              <p class="text-[11px] text-slate-400 mt-2 m-0">{{ 'admin.dashboard.arbitration' | translate }}</p>
            </div>

            <!-- Resolved -->
            <div class="kpi-card">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-2 min-w-0">
                  <div class="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                    <tui-icon icon="@tui.check-circle" class="w-4 h-4 text-emerald-500" />
                  </div>
                  <span class="text-[11px] font-semibold text-slate-500 leading-tight">{{ 'admin.dashboard.resolved' | translate }}</span>
                </div>
                @if (stats.totalDisputes > 0) {
                  <span class="hidden sm:inline text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap shrink-0 ml-1">
                    {{ stats.resolvedDisputes / stats.totalDisputes * 100 | number:'1.0-0' }}%
                  </span>
                }
              </div>
              <p class="text-3xl md:text-[38px] font-black text-slate-900 m-0 leading-none">{{ stats.resolvedDisputes }}</p>
              <p class="text-[11px] text-emerald-600 font-semibold mt-2 m-0">{{ 'admin.dashboard.resolvedRate' | translate:{ rate: stats.totalDisputes > 0 ? (stats.resolvedDisputes / stats.totalDisputes * 100 | number:'1.0-0') : 0 } }}</p>
            </div>

          </div>

          <!-- Row 2: Secondary KPI — stacked on mobile, 3-col on sm+ -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">

            <!-- Volume Released -->
            <div class="kpi-card">
              <div class="flex items-center gap-2.5 mb-3">
                <div class="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center shrink-0">
                  <tui-icon icon="@tui.trending-up" class="w-4 h-4 text-emerald-500" />
                </div>
                <span class="text-[11px] font-semibold text-slate-500">{{ 'admin.dashboard.volume' | translate }}</span>
              </div>
              <p class="text-2xl font-black text-slate-900 m-0 leading-none">{{ +stats.totalVolumeReleased | amount }}</p>
              <p class="text-[11px] text-slate-400 mt-2 m-0">{{ 'admin.dashboard.volumeSub' | translate:{ released: stats.releasedTransactions, disputed: stats.disputedTransactions } }}</p>
            </div>

            <!-- Active Users -->
            <div class="kpi-card">
              <div class="flex items-center gap-2.5 mb-3">
                <div class="w-8 h-8 rounded-[10px] bg-blue-50 flex items-center justify-center shrink-0">
                  <tui-icon icon="@tui.users" class="w-4 h-4 text-blue-500" />
                </div>
                <span class="text-[11px] font-semibold text-slate-500">{{ 'admin.dashboard.users' | translate }}</span>
              </div>
              <p class="text-3xl md:text-[38px] font-black text-slate-900 m-0 leading-none">{{ stats.activeUsers }}</p>
              <p class="text-[11px] text-slate-400 mt-2 m-0">{{ stats.totalBuyers }}A · {{ stats.totalSellers }}V</p>
            </div>

            <!-- Transactions -->
            <div class="kpi-card">
              <div class="flex items-center gap-2.5 mb-3">
                <div class="w-8 h-8 rounded-[10px] bg-indigo-50 flex items-center justify-center shrink-0">
                  <tui-icon icon="@tui.arrow-left-right" class="w-4 h-4 text-indigo-500" />
                </div>
                <span class="text-[11px] font-semibold text-slate-500">{{ 'admin.dashboard.transactions' | translate }}</span>
              </div>
              <p class="text-3xl md:text-[38px] font-black text-slate-900 m-0 leading-none">{{ stats.totalTransactions }}</p>
              <p class="text-[11px] text-slate-400 mt-2 m-0">{{ stats.releasedTransactions }} {{ 'admin.dashboard.releasedSuffix' | translate }}</p>
            </div>

          </div>

          <!-- Row 3: Charts -->
          <div class="kpi-card">
            <app-admin-charts [stats]="stats" />
          </div>

        }

        <!-- Dispute Queue -->
        <div class="kpi-card">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-[13px] font-black text-slate-900 m-0">
                {{ (isAdmin() ? 'admin.dashboard.allDisputes' : 'admin.dashboard.myQueue') | translate }}
              </h2>
              @if (!disputesQuery.isPending()) {
                <p class="text-[11px] text-slate-400 mt-0.5 m-0">
                  {{ 'admin.dashboard.queueCount' | translate:{ count: disputes().length } }}
                </p>
              }
            </div>
            <a routerLink="/admin/disputes"
               class="flex items-center gap-1.5 text-[11px] font-bold no-underline px-3 py-1.5 rounded-[10px] text-primary hover:bg-slate-100 transition-colors">
              {{ 'admin.dashboard.seeAll' | translate }}
              <tui-icon icon="@tui.arrow-right" class="w-3.5 h-3.5" />
            </a>
          </div>

          @if (disputesQuery.isPending()) {
            <div class="flex flex-col gap-2">
              @for (i of [1,2,3,4]; track i) {
                <div class="rounded-xl p-3 flex items-center gap-3 bg-[#F3F6FB]">
                  <div class="skeleton-shimmer w-9 h-9 rounded-[10px] shrink-0"></div>
                  <div class="flex-1">
                    <div class="skeleton-shimmer h-2.5 w-2/5 rounded-md mb-2"></div>
                    <div class="skeleton-shimmer h-2.5 w-3/5 rounded-md"></div>
                  </div>
                  <div class="skeleton-shimmer h-5 w-20 rounded-full"></div>
                </div>
              }
            </div>

          } @else if (disputes().length === 0) {
            <div class="rounded-xl border-2 border-dashed border-slate-200 py-10 text-center">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                <tui-icon icon="@tui.check-circle" class="w-5 h-5 text-emerald-500" />
              </div>
              <p class="text-[13px] font-bold text-slate-800 m-0">{{ 'admin.dashboard.queueEmpty' | translate }}</p>
              <p class="text-[11px] text-slate-400 mt-1 m-0">{{ 'admin.dashboard.queueEmptySub' | translate }}</p>
            </div>

          } @else {
            <div class="flex flex-col gap-0.5">
              @for (d of disputes(); track d.id) {
                <a [routerLink]="['/admin/disputes', d.id]"
                   class="queue-item flex items-center gap-3 px-2 py-2.5 rounded-xl no-underline hover:bg-slate-50 transition-colors">

                  <div class="relative shrink-0">
                    <div class="w-9 h-9 rounded-[10px] flex items-center justify-center"
                         [class]="disputeIconBg(d.status)">
                      <tui-icon [icon]="disputeIcon(d.status)" class="w-4 h-4"
                                [style.color]="disputeIconColor(d.status)" />
                    </div>
                    @if (d.status === 'OPENED') {
                      <span class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
                    }
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="text-[13px] font-bold text-slate-900 m-0 truncate">{{ d.reference }}</p>
                    <p class="text-[11px] text-slate-400 mt-0.5 m-0 truncate">
                      {{ d.buyerName ?? '—' }} · {{ d.sellerName ?? '—' }}
                      @if (d.grossAmount) {
                        · <span class="font-semibold text-slate-600">{{ d.grossAmount | amount }}</span>
                      }
                    </p>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <div class="flex flex-col items-end gap-1">
                      <app-status-badge [status]="d.status" />
                      <span class="text-[9px] text-slate-400">{{ d.createdAt | timeAgo }}</span>
                    </div>
                    <tui-icon icon="@tui.chevron-right"
                              class="queue-arrow w-4 h-4 text-slate-300 transition-transform" />
                  </div>

                </a>
              }
            </div>
          }
        </div>

      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private readonly auth = inject(AuthStore);

  protected readonly isAdminFlag = computed(() => this.auth.isAdmin() || this.auth.role() === 'SUPERVISOR');
  protected readonly statsQuery = injectAdminDashboardQuery(() => this.isAdminFlag());
  protected readonly disputesQuery = injectAdminDisputesQuery(() => ({
    isAdmin: this.isAdminFlag(),
    unassigned: false,
    page: 0,
    size: 20,
  }));

  protected readonly disputes = computed(() => this.disputesQuery.data()?.content ?? []);

  protected isAdmin() { return this.isAdminFlag(); }

  protected disputeIconBg(status: string): string {
    const map: Record<string, string> = {
      OPENED: 'bg-red-50', UNDER_REVIEW: 'bg-indigo-50',
      AWAITING_BUYER: 'bg-amber-50', AWAITING_SELLER: 'bg-amber-50',
      AWAITING_ARBITRATION_PAYMENT: 'bg-orange-50',
      REFERRED_TO_ARBITRATION: 'bg-violet-50',
      RESOLVED_BUYER: 'bg-emerald-50', RESOLVED_SELLER: 'bg-emerald-50',
      RESOLVED_SPLIT: 'bg-emerald-50', CLOSED_NO_ACTION: 'bg-slate-100',
    };
    return map[status] ?? 'bg-slate-50';
  }

  protected disputeIcon(status: string): string {
    const map: Record<string, string> = {
      OPENED: '@tui.triangle-alert', UNDER_REVIEW: '@tui.search',
      AWAITING_BUYER: '@tui.clock', AWAITING_SELLER: '@tui.clock',
      AWAITING_ARBITRATION_PAYMENT: '@tui.scale',
      REFERRED_TO_ARBITRATION: '@tui.landmark',
      RESOLVED_BUYER: '@tui.check-circle', RESOLVED_SELLER: '@tui.check-circle',
      RESOLVED_SPLIT: '@tui.handshake', CLOSED_NO_ACTION: '@tui.folder',
    };
    return map[status] ?? '@tui.circle';
  }

  protected disputeIconColor(status: string): string {
    const map: Record<string, string> = {
      OPENED: '#DC2626', UNDER_REVIEW: '#4F46E5',
      AWAITING_BUYER: '#D97706', AWAITING_SELLER: '#D97706',
      AWAITING_ARBITRATION_PAYMENT: '#EA580C',
      REFERRED_TO_ARBITRATION: '#7C3AED',
      RESOLVED_BUYER: '#10B981', RESOLVED_SELLER: '#10B981',
      RESOLVED_SPLIT: '#10B981', CLOSED_NO_ACTION: '#64748B',
    };
    return map[status] ?? '#64748B';
  }
}
