"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
  onUpgraded?: () => void;
}

const PACKS = [
  {
    id: "starter",
    label: "Top-Up",
    price: "₹99",
    priceNote: "one-time",
    highlight: false,
    perks: ["10 credits", "1 credit = 1 reel", "WAN2.1 quality", "No expiry"],
    cta: "Buy 10 Credits",
  },
  {
    id: "pro",
    label: "Pro",
    price: "₹499",
    priceNote: "/month",
    highlight: true,
    perks: ["60 credits/month", "VEO3 premium quality", "Priority generation", "Publish to Instagram + YouTube"],
    cta: "Upgrade to Pro →",
  },
];

async function loadRazorpay() {
  if (typeof window === "undefined" || (window as Window & { Razorpay?: unknown }).Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Razorpay"));
    document.body.appendChild(s);
  });
}

export default function UpgradeModal({ onClose, onUpgraded }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handlePurchase = async (pack: typeof PACKS[0]) => {
    setLoading(pack.id);
    setError(null);
    try {
      const { data } = await api.post("/payments/create-order", { plan: pack.id });
      await loadRazorpay();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "ReelCraft",
        description: pack.id === "starter" ? "10 Credits Top-Up" : "Pro Plan — ₹499/month",
        order_id: data.razorpay_order_id,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            await api.post("/payments/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            const stored = localStorage.getItem("user");
            if (stored) {
              const u = JSON.parse(stored);
              if (pack.id === "starter") {
                u.credits = (u.credits || 0) + 10;
              } else {
                u.plan = "pro";
                u.credits = 60;
              }
              localStorage.setItem("user", JSON.stringify(u));
            }
            onUpgraded?.();
            onClose();
          } catch {
            setError("Payment verified but credit update failed. Refresh the page.");
          }
        },
        prefill: {},
        theme: { color: "#f97316" },
      };

      const rzp = new (window as Window & { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      setError((err as { response?: { data?: { detail?: string } } }).response?.data?.detail || "Failed to create order. Try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg glass p-8 space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">⚡</div>
          <h2 className="text-2xl font-black" style={{ color: "var(--ink)" }}>Out of Credits</h2>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Top up instantly or go Pro for monthly credits</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl p-5 space-y-3"
              style={{
                background: pack.highlight ? "var(--orange-lt)" : "var(--bg)",
                border: pack.highlight ? "2px solid var(--orange)" : "2px solid var(--line-strong)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: pack.highlight ? "var(--orange)" : "var(--muted)" }}>
                  {pack.label}
                </span>
                {pack.highlight && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white" style={{ background: "var(--orange)" }}>Popular</span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black" style={{ color: "var(--ink)" }}>{pack.price}</span>
                <span className="text-xs" style={{ color: "var(--muted)" }}>{pack.priceNote}</span>
              </div>

              <ul className="space-y-1.5">
                {pack.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs" style={{ color: "var(--ink-2)" }}>
                    <span style={{ color: "var(--green)" }}>✓</span>
                    {p}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(pack)}
                disabled={loading !== null}
                className={pack.highlight ? "btn-primary w-full" : "w-full py-2.5 rounded-xl text-sm font-bold transition-all"}
                style={pack.highlight ? {} : {
                  background: "var(--bg-2)",
                  color: "var(--ink)",
                  border: "2px solid var(--line-strong)",
                }}
              >
                {loading === pack.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--ink)" }} />
                    Loading...
                  </span>
                ) : (
                  pack.cta
                )}
              </button>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-xl p-3 text-sm text-center" style={{ background: "#FEE2E2", border: "1px solid #FCA5A5", color: "#DC2626" }}>
            {error}
          </div>
        )}

        <button onClick={onClose} className="w-full text-sm transition-colors" style={{ color: "var(--muted)" }}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
