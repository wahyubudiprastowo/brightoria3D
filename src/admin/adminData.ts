import { worlds } from '../data/worlds';
import { loadIdentity } from '../game/identity';
import { loadProgress } from '../game/progress';
import { chapters as adabChapters } from '../game/adab/scenarios';
import { computeMastery as adabMastery, loadEvidence as loadAdab } from '../game/adab/evidence';
import { arabicLevels } from '../game/arabic/levels';
import { computeMastery as arabicMastery, loadEvidence as loadArabic } from '../game/arabic/evidence';
import { digitalLevels } from '../game/digital/levels';
import { computeMastery as digitalMastery, loadEvidence as loadDigital } from '../game/digital/evidence';
import { englishLevels } from '../game/english/levels';
import { computeMastery as englishMastery, loadEvidence as loadEnglish } from '../game/english/evidence';
import { numeriaLevels } from '../game/numeria/levels';
import { computeMastery as numeriaMastery, loadEvidence as loadNumeria } from '../game/numeria/evidence';
import { quranLevels } from '../game/quran/levels';
import { computeMastery as quranMastery, loadEvidence as loadQuran } from '../game/quran/evidence';
import { PREMIUM_PLANS, readCheckoutIntent, readPremiumEntitlement } from '../subscription/premiumAccess';

export interface AdminWorldMetric {
  id: string;
  name: string;
  subtitle: string;
  color: string;
  mastery: number;
  completed: number;
  total: number;
  attempts: number;
  updatedAt: string | null;
}

export interface AdminSnapshot {
  generatedAt: string;
  profile: {
    name: string;
    chosen: boolean;
    gender: 'boy' | 'girl';
  };
  progress: {
    xp: number;
    level: number;
    streak: number;
  };
  worlds: AdminWorldMetric[];
  averageMastery: number;
  startedWorlds: number;
  totalCompleted: number;
  totalAttempts: number;
  subscription: {
    active: boolean;
    planName: string | null;
    status: 'free' | 'active' | 'lifetime';
    verifiedAt: string | null;
    expiresAt: string | null;
    checkoutIntent: ReturnType<typeof readCheckoutIntent>;
  };
  storage: {
    recordCount: number;
    approximateKb: number;
  };
}

function countNumberValues(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
}

function storageSummary() {
  let recordCount = 0;
  let characters = 0;
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith('brightoria.')) continue;
      recordCount += 1;
      characters += key.length + (localStorage.getItem(key)?.length ?? 0);
    }
  } catch {
    return { recordCount: 0, approximateKb: 0 };
  }
  return { recordCount, approximateKb: Math.round((characters * 2 / 1024) * 10) / 10 };
}

export function readAdminSnapshot(): AdminSnapshot {
  const identity = loadIdentity();
  const progress = loadProgress();
  const quran = loadQuran();
  const adab = loadAdab();
  const numeria = loadNumeria();
  const arabic = loadArabic();
  const english = loadEnglish();
  const digital = loadDigital();

  const evidenceByWorld: Record<string, Omit<AdminWorldMetric, 'id' | 'name' | 'subtitle' | 'color'>> = {
    quran: {
      mastery: quranMastery(quran, quranLevels.length),
      completed: quran.completed.length,
      total: quranLevels.length,
      attempts: Object.values(quran.letters).reduce((sum, item) => sum + item.attempts, 0),
      updatedAt: quran.updatedAt === new Date(0).toISOString() ? null : quran.updatedAt,
    },
    adab: {
      mastery: adabMastery(adab, adabChapters.length),
      completed: adab.completed.length,
      total: adabChapters.length,
      attempts: Object.values(adab.chapters).reduce((sum, item) => sum + item.attempts, 0),
      updatedAt: adab.updatedAt === new Date(0).toISOString() ? null : adab.updatedAt,
    },
    math: {
      mastery: numeriaMastery(numeria, numeriaLevels.length),
      completed: numeria.completed.length,
      total: numeriaLevels.length,
      attempts: countNumberValues(numeria.attempts),
      updatedAt: numeria.updatedAt === new Date(0).toISOString() ? null : numeria.updatedAt,
    },
    arabic: {
      mastery: arabicMastery(arabic, arabicLevels.length),
      completed: arabic.completed.length,
      total: arabicLevels.length,
      attempts: Object.values(arabic.stops).reduce((sum, item) => sum + item.attempts, 0),
      updatedAt: arabic.updatedAt === new Date(0).toISOString() ? null : arabic.updatedAt,
    },
    english: {
      mastery: englishMastery(english, englishLevels.length),
      completed: english.completed.length,
      total: englishLevels.length,
      attempts: Object.values(english.islands).reduce((sum, item) => sum + item.attempts, 0),
      updatedAt: english.updatedAt === new Date(0).toISOString() ? null : english.updatedAt,
    },
    digital: {
      mastery: digitalMastery(digital, digitalLevels.length),
      completed: digital.completed.length,
      total: digitalLevels.length,
      attempts: countNumberValues(digital.attempts),
      updatedAt: digital.updatedAt === new Date(0).toISOString() ? null : digital.updatedAt,
    },
  };

  const worldMetrics = worlds.map((world) => ({
    id: world.id,
    name: world.name,
    subtitle: world.subtitle,
    color: world.color,
    ...evidenceByWorld[world.id],
  }));
  const started = worldMetrics.filter((world) => world.completed > 0);
  const entitlement = readPremiumEntitlement();
  const plan = entitlement ? PREMIUM_PLANS.find((item) => item.id === entitlement.planId) : null;

  return {
    generatedAt: new Date().toISOString(),
    profile: {
      name: identity.name || 'Penjelajah',
      chosen: identity.chosen,
      gender: identity.gender,
    },
    progress: { xp: progress.xp, level: progress.level, streak: progress.streak },
    worlds: worldMetrics,
    averageMastery: started.length
      ? Math.round(started.reduce((sum, world) => sum + world.mastery, 0) / started.length)
      : 0,
    startedWorlds: started.length,
    totalCompleted: worldMetrics.reduce((sum, world) => sum + world.completed, 0),
    totalAttempts: worldMetrics.reduce((sum, world) => sum + world.attempts, 0),
    subscription: {
      active: entitlement !== null,
      planName: plan?.name ?? null,
      status: entitlement?.status ?? 'free',
      verifiedAt: entitlement?.verifiedAt ?? null,
      expiresAt: entitlement?.expiresAt ?? null,
      checkoutIntent: readCheckoutIntent(),
    },
    storage: storageSummary(),
  };
}

export function downloadAdminReport(snapshot: AdminSnapshot): void {
  const report = {
    product: 'Brightoria by Bright Academy',
    scope: 'Data lokal perangkat ini saja',
    generatedAt: snapshot.generatedAt,
    profile: snapshot.profile,
    progress: snapshot.progress,
    worlds: snapshot.worlds,
    subscription: {
      active: snapshot.subscription.active,
      planName: snapshot.subscription.planName,
      status: snapshot.subscription.status,
      verifiedAt: snapshot.subscription.verifiedAt,
      expiresAt: snapshot.subscription.expiresAt,
      checkoutIntent: snapshot.subscription.checkoutIntent,
    },
    storage: snapshot.storage,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `brightoria-admin-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}
