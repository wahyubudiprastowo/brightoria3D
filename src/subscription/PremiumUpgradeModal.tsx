import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Check, Crown, Landmark, LockKeyhole, QrCode, ShieldCheck, X } from 'lucide-react';
import {
  buildPremiumCheckoutUrl,
  formatRupiah,
  hasPremiumAccess,
  PREMIUM_ACCESS_EVENT,
  PREMIUM_PLANS,
  saveCheckoutIntent,
  type PremiumPlanId,
} from './premiumAccess';

interface PremiumUpgradeModalProps {
  open: boolean;
  featureId: string;
  featureTitle: string;
  onClose: () => void;
  onAccessVerified?: () => void;
}

export function PremiumUpgradeModal({
  open,
  featureId,
  featureTitle,
  onClose,
  onAccessVerified,
}: PremiumUpgradeModalProps) {
  const [selectedPlanId, setSelectedPlanId] = useState<PremiumPlanId>('1_year');
  const [notice, setNotice] = useState<string | null>(null);
  const selectedPlan = useMemo(
    () => PREMIUM_PLANS.find((plan) => plan.id === selectedPlanId) ?? PREMIUM_PLANS[2],
    [selectedPlanId],
  );

  useEffect(() => {
    if (!open) return;
    setNotice(null);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function requireAccount(): boolean {
    if (document.documentElement.dataset.brightoriaAuthenticated === 'true') return false;
    window.dispatchEvent(new CustomEvent('brightoria:request-auth', { detail: { mode: 'register' } }));
    setNotice('Daftar atau masuk terlebih dahulu untuk melanjutkan ke fitur Premium. Pilihan paket ini tetap terbuka setelah login.');
    return true;
  }

  function continueToCheckout() {
    if (requireAccount()) return;
    saveCheckoutIntent(selectedPlan.id, featureId);
    const checkoutUrl = buildPremiumCheckoutUrl(selectedPlan.id, featureId);
    if (!checkoutUrl) {
      setNotice('Pembayaran resmi Brightoria belum terhubung. Materi tetap terkunci sampai transaksi diverifikasi oleh sistem Bright Academy.');
      return;
    }
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    setNotice('Halaman pembayaran dibuka di tab baru. Setelah pembayaran terverifikasi, kembali ke sini lalu periksa status akses.');
  }

  function checkAccess() {
    if (requireAccount()) return;
    if (!hasPremiumAccess()) {
      setNotice('Pembayaran belum terverifikasi. Materi Premium masih terkunci agar akses tidak terbuka sebelum pembelian berhasil.');
      return;
    }
    window.dispatchEvent(new Event(PREMIUM_ACCESS_EVENT));
    onAccessVerified?.();
    onClose();
  }

  return (
    <div className="premium-gate-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <section className="premium-gate-modal" role="dialog" aria-modal="true" aria-labelledby="premium-gate-title">
        <button type="button" className="premium-gate-close" onClick={onClose} aria-label="Tutup pilihan Premium">
          <X size={19} />
        </button>

        <div className="premium-gate-header">
          <span className="premium-gate-crown"><Crown size={27} /></span>
          <div>
            <span className="premium-gate-status"><LockKeyhole size={13} /> Akun Free aktif</span>
            <h2 id="premium-gate-title">Buka Brightoria Premium</h2>
            <p><b>{featureTitle}</b> adalah materi Premium. Pilih paket untuk membuka semua jalur belajar lanjutan.</p>
          </div>
        </div>

        <div className="premium-gate-body">
          <div className="premium-plan-list" role="radiogroup" aria-label="Pilihan paket Brightoria Premium">
            {PREMIUM_PLANS.map((plan) => {
              const selected = selectedPlanId === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={'premium-plan-option' + (selected ? ' selected' : '')}
                  onClick={() => {
                    setSelectedPlanId(plan.id);
                    setNotice(null);
                  }}
                >
                  {plan.popular && <span className="premium-plan-popular">Paling hemat</span>}
                  <span className="premium-plan-radio" aria-hidden="true"><i /></span>
                  <span className="premium-plan-copy">
                    <b>{plan.shortName}</b>
                    <small>{plan.durationLabel}</small>
                    <small>{plan.monthlyLabel}</small>
                  </span>
                  <span className="premium-plan-price">
                    <b>{formatRupiah(plan.priceIdr)}</b>
                    {plan.originalPriceIdr && <del>{formatRupiah(plan.originalPriceIdr)}</del>}
                    {plan.discountPercent && <small>Hemat {plan.discountPercent}%</small>}
                  </span>
                </button>
              );
            })}
          </div>

          <aside className="premium-benefits">
            <h3><Crown size={17} /> Yang terbuka dengan Premium</h3>
            {[
              'Tilawah 30 juz dan materi murojaah luas',
              "Kamus Qur'an lanjutan lintas surat",
              'Hikmah surat dan praktik adab Qur\'ani',
              'Materi Premium baru selama paket aktif',
            ].map((benefit) => (
              <span key={benefit}><Check size={14} /> {benefit}</span>
            ))}
            <div className="premium-payment-methods">
              <b>Metode pada checkout resmi</b>
              <span><QrCode size={15} /> QRIS</span>
              <span><Landmark size={15} /> Transfer bank</span>
            </div>
          </aside>
        </div>

        {notice && <div className="premium-gate-notice" role="status">{notice}</div>}

        <footer className="premium-gate-footer">
          <div>
            <b>{selectedPlan.name}</b>
            <small>Tidak ada materi yang terbuka sebelum pembayaran terverifikasi.</small>
          </div>
          <button type="button" className="premium-checkout-button" onClick={continueToCheckout}>
            Lanjutkan pembayaran <ArrowRight size={17} />
          </button>
          <button type="button" className="premium-recheck-button" onClick={checkAccess}>
            <ShieldCheck size={15} /> Saya sudah membayar
          </button>
        </footer>
      </section>
    </div>
  );
}
