"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import api from "@/lib/api";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "",
    credits: 2,
    creditLabel: "2 videos total",
    overage: null,
    highlight: false,
    badge: null,
    features: ["AI-generated video (2 scenes)", "Hindi / English / Hinglish", "Auto captions", "Watermarked output"],
    cta: "Current Plan",
    disabled: true,
  },
  {
    id: "first_video",
    name: "First Reel",
    price: "₹29",
    period: "one-time",
    credits: 1,
    creditLabel: "1 clean video",
    overage: null,
    highlight: false,
    badge: "TRY IT",
    features: ["1 video credit", "No watermark", "Post directly to Instagram & YouTube", "2 AI-generated scenes"],
    cta: "Post Your First Reel",
    disabled: false,
  },
  {
    id: "starter",
    name: "Starter Pack",
    price: "₹99",
    period: "one-time",
    credits: 10,
    creditLabel: "10 videos",
    overage: null,
    highlight: false,
    badge: "TOP UP",
    features: ["10 video credits", "No expiry", "AI-generated video (2 scenes)", "No watermark", "Post directly to Instagram & YouTube"],
    cta: "Buy Pack",
    disabled: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹499",
    period: "/mo",
    credits: 60,
    creditLabel: "2 videos/day",
    overage: "₹8/video after",
    highlight: true,
    badge: "POPULAR",
    features: ["60 videos/month", "Enhanced AI video (3 scenes)", "No watermark", "Auto-publish to Instagram & YouTube", "Priority queue", "₹8/video overage"],
    cta: "Go Pro",
    disabled: false,
  },
  {
    id: "business",
    name: "Business",
    price: "₹3,999",
    period: "/mo",
    credits: 100,
    creditLabel: "Coming Soon",
    overage: null,
    highlight: false,
    badge: "SOON",
    features: ["Everything in Pro", "100 videos/month", "4 scenes per reel", "Team access", "Priority support"],
    cta: "Notify Me",
    disabled: true,
  },
];

declare global {
  interface Window { Razorpay: any; }
}

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleBuy = async (planId: string) => {
    setLoading(planId);
    try {
      const endpoint = planId === "first_video"
        ? "/payments/first-video-order"
        : "/payments/create-order";
      const body = planId === "first_video" ? {} : { plan: planId };
      const { data } = await api.post(endpoint, body);

      const plan = PLANS.find(p => p.id === planId);
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "ReelCraft",
        description: plan?.name,
        order_id: data.razorpay_order_id,
        handler: async (response: any) => {
          await api.post("/payments/verify", {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
          router.push("/dashboard");
        },
        theme: { color: "#FF5C00" },
      };
      const rz = new window.Razorpay(options);
      rz.open();
    } catch (e) {
      alert("Payment failed. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <AppShell>
      <div style={{ padding: "32px 28px", maxWidth: 1200 }}>
        <div style={{ marginBottom: 32, textAlign: "center" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(28px,4vw,48px)", color: "var(--ink)", marginBottom: 8 }}>
            PICK YOUR PLAN
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 16 }}>
            Type your idea in Hindi or English — get a reel in 45 seconds
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 40 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.highlight ? "var(--orange)" : "var(--card)",
                border: "2px solid var(--ink)",
                borderRadius: "var(--r-md)",
                boxShadow: plan.highlight ? "6px 6px 0 var(--ink)" : "var(--shadow-sm)",
                padding: "24px 20px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative",
              }}
            >
              {plan.badge && (
                <div style={{
                  position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                  background: plan.highlight ? "var(--ink)" : plan.id === "first_video" ? "#16a34a" : "var(--orange)",
                  color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10,
                  fontWeight: 700, letterSpacing: "0.1em", padding: "3px 10px",
                  borderRadius: 999, border: "2px solid var(--ink)",
                }}>
                  {plan.badge}
                </div>
              )}

              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: plan.highlight ? "rgba(255,255,255,0.7)" : "var(--muted)", marginBottom: 6 }}>
                  {plan.name}
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: plan.highlight ? "#fff" : "var(--ink)", lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  {plan.period && (
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 14, color: plan.highlight ? "rgba(255,255,255,0.7)" : "var(--ink-2)", fontWeight: 600 }}>
                      {plan.period}
                    </span>
                  )}
                </div>
              </div>

              <div style={{
                background: plan.highlight ? "rgba(0,0,0,0.15)" : "var(--bg-2)",
                borderRadius: "var(--r-sm)", padding: "10px 14px",
                border: "1px solid " + (plan.highlight ? "rgba(255,255,255,0.2)" : "var(--ink)"),
              }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: plan.highlight ? "#fff" : "var(--ink)", lineHeight: 1 }}>
                  {plan.creditLabel}
                </div>
                {plan.overage && (
                  <div style={{ fontFamily: "var(--font-body)", fontSize: 12, color: plan.highlight ? "rgba(255,255,255,0.7)" : "var(--ink-2)", marginTop: 4, fontWeight: 600 }}>
                    {plan.overage}
                  </div>
                )}
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-body)", fontSize: 13, color: plan.highlight ? "#fff" : "var(--ink-2)", fontWeight: 500 }}>
                    <span style={{ color: plan.highlight ? "#fff" : "var(--green)", flexShrink: 0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !plan.disabled && handleBuy(plan.id)}
                disabled={plan.disabled || loading === plan.id}
                style={{
                  padding: "12px 20px", borderRadius: "var(--r-sm)",
                  fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 14,
                  cursor: plan.disabled ? "default" : "pointer",
                  border: "2px solid var(--ink)",
                  background: plan.disabled
                    ? "var(--bg-2)"
                    : plan.highlight
                    ? "#fff"
                    : plan.id === "first_video"
                    ? "#16a34a"
                    : "var(--ink)",
                  color: plan.disabled
                    ? "var(--muted)"
                    : plan.highlight
                    ? "var(--orange)"
                    : "#fff",
                  boxShadow: plan.disabled ? "none" : "3px 3px 0 rgba(0,0,0,0.3)",
                  opacity: loading && loading !== plan.id ? 0.6 : 1,
                  transition: "all 0.08s ease",
                }}
              >
                {loading === plan.id ? "Processing…" : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div style={{
          background: "var(--card)", border: "2px solid var(--ink)",
          borderRadius: "var(--r-md)", boxShadow: "var(--shadow-sm)",
          padding: "20px 24px",
          display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
        }}>
          <span style={{ fontSize: 28 }}>💡</span>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink)", marginBottom: 4 }}>
              WHY PRO?
            </div>
            <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--ink-2)", margin: 0 }}>
              Pro gives you <strong>2 reels/day</strong> with 3 AI-generated scenes, auto-published to Instagram & YouTube. Average creator posts 20 reels/month = <strong>₹25/reel</strong>. Saves 2+ hours per reel.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
