"use client";
import { useState } from "react";
import api from "@/lib/api";

interface Props {
  onClose: () => void;
  onUpgraded?: () => void;
}

export default function UpgradeModal({ onClose, onUpgraded }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/payments/create-order", { plan: "pro" });

      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      // Load Razorpay script dynamically
      if (typeof window !== "undefined" && !(window as any).Razorpay) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://checkout.razorpay.com/v1/checkout.js";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Failed to load Razorpay"));
          document.body.appendChild(script);
        });
      }

      const options = {
        key: razorpayKey,
        amount: data.amount,
        currency: "INR",
        name: "ReelCraft Pro",
        description: "Unlimited AI Reels — ₹499/month",
        order_id: data.razorpay_order_id,
        handler: async (response: any) => {
          try {
            await api.post("/payments/verify", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            // Update local user state
            const stored = localStorage.getItem("user");
            if (stored) {
              const u = JSON.parse(stored);
              u.plan = "pro";
              u.credits = 9999;
              localStorage.setItem("user", JSON.stringify(u));
            }
            onUpgraded?.();
            onClose();
          } catch {
            setError("Payment verification failed. Contact support.");
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
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md glass p-8 text-center space-y-6">
        <div className="text-5xl">⚡</div>

        <div>
          <h2 className="text-2xl font-black text-white mb-2">Out of Credits</h2>
          <p className="text-white/50 text-sm">
            Upgrade to Pro for unlimited reels, VEO3 premium quality, and direct publishing to all platforms.
          </p>
        </div>

        {/* Plan card */}
        <div className="bg-gradient-to-br from-orange-500/10 to-pink-500/10 border border-orange-500/30 rounded-2xl p-5 text-left space-y-3">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white">₹499</span>
            <span className="text-white/40 text-sm">/month</span>
          </div>
          <ul className="space-y-2">
            {[
              "Unlimited reels",
              "VEO3 premium video quality",
              "12 AI voices",
              "Publish to Instagram + YouTube",
              "Priority generation",
              "No watermark",
            ].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                <span className="text-green-400 text-xs">✓</span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1 py-3 text-sm">
            Maybe later
          </button>
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="btn-primary flex-1 py-3 text-sm font-bold"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              "Upgrade to Pro →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
