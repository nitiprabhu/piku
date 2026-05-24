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
  if (typeof window === "undefined" || (window as any).Razorpay) return;
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
        handler: async (response: any) => {
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

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create order. Try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg glass p-8 space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">⚡</div>
          <h2 className="text-2xl font-black text-white">Out of Credits</h2>
          <p className="text-white/50 text-sm mt-1">Top up instantly or go Pro for monthly credits</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {PACKS.map((pack) => (
            <div
              key={pack.id}
              className={`rounded-2xl p-5 space-y-3 border ${
                pack.highlight
                  ? "bg-gradient-to-br from-orange-500/15 to-pink-500/15 border-orange-500/40"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold uppercase tracking-wider ${pack.highlight ? "text-orange-400" : "text-white/40"}`}>
                  {pack.label}
                </span>
                {pack.highlight && (
                  <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">Popular</span>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white">{pack.price}</span>
                <span className="text-white/40 text-xs">{pack.priceNote}</span>
              </div>

              <ul className="space-y-1.5">
                {pack.perks.map((p) => (
                  <li key={p} className="flex items-center gap-2 text-xs text-white/60">
                    <span className="text-green-400">✓</span>
                    {p}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(pack)}
                disabled={loading !== null}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                  pack.highlight
                    ? "btn-primary"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {loading === pack.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <button onClick={onClose} className="w-full text-white/30 text-sm hover:text-white/50 transition-colors">
          Maybe later
        </button>
      </div>
    </div>
  );
}
