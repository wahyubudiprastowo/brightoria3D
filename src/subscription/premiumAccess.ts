export type PremiumPlanId = '1_month' | '3_months' | '1_year' | 'lifetime';

export interface PremiumPlan {
  id: PremiumPlanId;
  name: string;
  shortName: string;
  durationLabel: string;
  priceIdr: number;
  originalPriceIdr?: number;
  monthlyLabel: string;
  discountPercent?: number;
  popular?: boolean;
}

export interface PremiumEntitlement {
  status: 'active' | 'lifetime';
  planId: PremiumPlanId;
  verifiedAt: string;
  expiresAt?: string;
  verificationId: string;
}

export interface CheckoutIntent {
  planId: PremiumPlanId;
  featureId: string;
  createdAt: string;
}

export const PREMIUM_ENTITLEMENT_KEY = 'brightoria.premium.entitlement.v1';
const CHECKOUT_INTENT_KEY = 'brightoria.premium.checkoutIntent.v1';
export const PREMIUM_ACCESS_EVENT = 'brightoria:premium-access-changed';

export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: '1_month',
    name: 'Brightoria Premium 1 Bulan',
    shortName: '1 bulan',
    durationLabel: 'Coba satu bulan',
    priceIdr: 49_000,
    monthlyLabel: 'Rp49.000/bulan',
  },
  {
    id: '3_months',
    name: 'Brightoria Premium 3 Bulan',
    shortName: '3 bulan',
    durationLabel: 'Belajar satu semester pendek',
    priceIdr: 99_000,
    originalPriceIdr: 147_000,
    monthlyLabel: 'setara Rp33.000/bulan',
    discountPercent: 33,
  },
  {
    id: '1_year',
    name: 'Brightoria Premium 1 Tahun',
    shortName: '1 tahun',
    durationLabel: 'Pendamping belajar setahun',
    priceIdr: 299_000,
    originalPriceIdr: 588_000,
    monthlyLabel: 'setara Rp24.900/bulan',
    discountPercent: 52,
    popular: true,
  },
  {
    id: 'lifetime',
    name: 'Brightoria Premium Lifetime',
    shortName: 'Lifetime',
    durationLabel: 'Sekali bayar, akses seterusnya',
    priceIdr: 1_199_000,
    originalPriceIdr: 1_700_000,
    monthlyLabel: 'sekali bayar',
    discountPercent: 30,
  },
];

function isPlanId(value: unknown): value is PremiumPlanId {
  return PREMIUM_PLANS.some((plan) => plan.id === value);
}

export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString('id-ID')}`;
}

export function readPremiumEntitlement(): PremiumEntitlement | null {
  try {
    const raw = localStorage.getItem(PREMIUM_ENTITLEMENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PremiumEntitlement>;
    if (
      (parsed.status !== 'active' && parsed.status !== 'lifetime')
      || !isPlanId(parsed.planId)
      || typeof parsed.verifiedAt !== 'string'
      || typeof parsed.verificationId !== 'string'
      || parsed.verificationId.length < 8
    ) {
      return null;
    }
    if (parsed.status === 'active') {
      if (!parsed.expiresAt || Date.parse(parsed.expiresAt) <= Date.now()) return null;
    }
    return parsed as PremiumEntitlement;
  } catch {
    return null;
  }
}

export function hasPremiumAccess(): boolean {
  return readPremiumEntitlement() !== null;
}

export function saveCheckoutIntent(planId: PremiumPlanId, featureId: string): void {
  const intent: CheckoutIntent = { planId, featureId, createdAt: new Date().toISOString() };
  try {
    localStorage.setItem(CHECKOUT_INTENT_KEY, JSON.stringify(intent));
  } catch {
    // Embedded previews may disable storage; checkout can still continue.
  }
}

export function readCheckoutIntent(): CheckoutIntent | null {
  try {
    const raw = localStorage.getItem(CHECKOUT_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutIntent>;
    if (!isPlanId(parsed.planId) || typeof parsed.featureId !== 'string' || typeof parsed.createdAt !== 'string') {
      return null;
    }
    return parsed as CheckoutIntent;
  } catch {
    return null;
  }
}

export function buildPremiumCheckoutUrl(planId: PremiumPlanId, featureId: string): string | null {
  const configuredUrl = import.meta.env.VITE_PREMIUM_CHECKOUT_URL?.trim();
  if (!configuredUrl) return null;

  try {
    const url = new URL(configuredUrl, window.location.origin);
    url.searchParams.set('plan', planId);
    url.searchParams.set('feature', featureId);
    url.searchParams.set('product', 'brightoria-premium');
    url.searchParams.set('return_url', window.location.href);
    return url.toString();
  } catch {
    return null;
  }
}
