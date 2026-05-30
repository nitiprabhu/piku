"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import api, { getStoredUser } from "@/lib/api";
import AppShell from "@/components/AppShell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedProduct {
  name: string;
  selling_price: number;
  mrp: number;
  discount_pct: number;
  images: string[];
  description: string;
  category: string;
  url: string;
  scrape_partial: boolean;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="section-label">{label}</div>
        {sublabel && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 2 }}>
            {sublabel}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

function DiscountBadge({ pct }: { pct: number }) {
  if (pct <= 0) return null;
  return (
    <span
      style={{
        display: "inline-block",
        background: "#E53935",
        color: "#fff",
        fontWeight: 800,
        fontSize: 11,
        borderRadius: 999,
        padding: "2px 8px",
        marginLeft: 8,
        border: "1.5px solid var(--ink)",
        fontFamily: "var(--font-body)",
        letterSpacing: "0.04em",
      }}
    >
      {pct}% OFF
    </span>
  );
}

function ProductPreviewCard({
  product,
  onClear,
}: {
  product: ScrapedProduct;
  onClear: () => void;
}) {
  const thumb = product.images[0] || null;
  return (
    <div
      style={{
        border: "2px solid var(--ink)",
        borderRadius: "var(--r-sm)",
        background: "var(--card)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", gap: 0 }}>
        {thumb && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumb}
            alt={product.name}
            style={{
              width: 100,
              height: 120,
              objectFit: "cover",
              flexShrink: 0,
              borderRight: "2px solid var(--ink)",
            }}
          />
        )}
        <div style={{ padding: "14px 16px", flex: 1 }}>
          <div
            style={{
              fontFamily: "var(--font-body)",
              fontWeight: 800,
              fontSize: 15,
              marginBottom: 6,
              lineHeight: 1.3,
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 4,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 900,
                fontSize: 18,
                color: "var(--orange)",
              }}
            >
              ₹{product.selling_price}
            </span>
            {product.mrp > product.selling_price && (
              <span
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "var(--muted)",
                  textDecoration: "line-through",
                }}
              >
                ₹{product.mrp}
              </span>
            )}
            <DiscountBadge pct={product.discount_pct} />
          </div>
          {product.category && (
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "var(--muted)",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                fontFamily: "var(--font-body)",
              }}
            >
              {product.category}
            </div>
          )}
        </div>
      </div>
      {product.images.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "8px 12px",
            borderTop: "2px solid var(--ink)",
            overflowX: "auto",
          }}
        >
          {product.images.slice(0, 6).map((img, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={img}
              alt={`Product image ${i + 1}`}
              style={{
                width: 50,
                height: 60,
                objectFit: "cover",
                borderRadius: 4,
                border: "1.5px solid var(--ink)",
                flexShrink: 0,
              }}
            />
          ))}
        </div>
      )}
      {product.scrape_partial && (
        <div
          style={{
            padding: "8px 14px",
            background: "var(--orange-lt, #FFF3E0)",
            borderTop: "2px solid var(--orange)",
            fontSize: 12,
            fontWeight: 600,
            color: "var(--orange-dark, #E65100)",
            fontFamily: "var(--font-body)",
          }}
        >
          Auto-scrape could not fetch all details. Please fill in price below.
        </div>
      )}
      <div
        style={{
          padding: "6px 14px",
          borderTop: "1px solid var(--ink)",
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <button
          onClick={onClear}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            color: "var(--muted)",
            fontFamily: "var(--font-body)",
            fontWeight: 600,
          }}
        >
          Clear product
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProductAdPage() {
  const router = useRouter();

  // Auth guard
  useEffect(() => {
    const user = getStoredUser();
    if (!user) router.push("/login");
  }, [router]);

  // Credits display
  const [credits, setCredits] = useState<number | null>(null);
  useEffect(() => {
    api
      .get("/user/credits")
      .then((r) => setCredits(r.data.remaining))
      .catch(() => {});
  }, []);

  // URL input
  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [product, setProduct] = useState<ScrapedProduct | null>(null);

  // Manual override (shown when scrape_partial=true)
  const [overrideName, setOverrideName] = useState("");
  const [overridePrice, setOverridePrice] = useState("");
  const [overrideMrp, setOverrideMrp] = useState("");
  const [overrideDescription, setOverrideDescription] = useState("");

  // Options
  const [language, setLanguage] = useState<"hi" | "hinglish">("hi");
  const [presenterGender, setPresenterGender] = useState<"female" | "male">("female");
  const [voiceId, setVoiceId] = useState("priya_f");

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync voice when gender changes
  const defaultVoice = (gender: "female" | "male") =>
    gender === "female" ? "priya_f" : "rohit_m";

  const handlePresenterGender = (g: "female" | "male") => {
    setPresenterGender(g);
    setVoiceId(defaultVoice(g));
  };

  // ── Scrape ──────────────────────────────────────────────────────────────
  const handleScrape = async () => {
    if (!url.includes("meesho.com")) {
      setScrapeError("Please paste a meesho.com product link");
      return;
    }
    setScraping(true);
    setScrapeError(null);
    setProduct(null);
    try {
      // Use unauthenticated axios call (scrape endpoint is public)
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8005";
      const resp = await fetch(`${API_URL}/api/v1/product-ad/scrape`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(
          (err as { detail?: string }).detail || `HTTP ${resp.status}`
        );
      }
      const data: ScrapedProduct = await resp.json();
      setProduct(data);
      if (data.scrape_partial) {
        setOverrideName(data.name !== "Product" ? data.name : "");
      }
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : "Failed to fetch product details";
      setScrapeError(msg);
    } finally {
      setScraping(false);
    }
  };

  // ── Generate ─────────────────────────────────────────────────────────────
  const canGenerate =
    product !== null &&
    (!product.scrape_partial ||
      (overrideName.trim().length > 0 && overridePrice.trim().length > 0));

  const handleGenerate = async () => {
    if (!product) return;
    if (credits !== null && credits < 3) {
      setSubmitError(
        "You need at least 3 credits to create a product ad. Please top up."
      );
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {
        meesho_url: url,
        language,
        voice_id: voiceId,
        presenter_gender: presenterGender,
      };
      if (product.scrape_partial) {
        if (overrideName.trim()) payload.override_name = overrideName.trim();
        if (overridePrice.trim())
          payload.override_price = parseInt(overridePrice, 10);
        if (overrideMrp.trim())
          payload.override_mrp = parseInt(overrideMrp, 10);
        if (overrideDescription.trim()) payload.override_description = overrideDescription.trim();
      }
      const { data } = await api.post("/product-ad/generate", payload);
      router.push(`/projects/${data.project_id}?job_id=${data.job_id}`);
    } catch (e: unknown) {
      const errObj = e as {
        response?: { data?: { detail?: string } };
        message?: string;
      };
      setSubmitError(
        errObj.response?.data?.detail ||
          errObj.message ||
          "Failed to start generation"
      );
      setSubmitting(false);
    }
  };

  // ── helpers ──────────────────────────────────────────────────────────────
  const sel = (active: boolean) => ({
    background: active ? "var(--orange)" : "var(--card)",
    color: active ? "#fff" : "var(--ink)",
    border: "2px solid var(--ink)",
    boxShadow: active ? "var(--shadow-sm)" : "none",
  });

  const voices = [
    { id: "priya_f", label: "Priya", emoji: "👩", lang: "Hindi", gender: "female" },
    { id: "ananya_f", label: "Ananya", emoji: "👩‍💼", lang: "English", gender: "female" },
    { id: "rohit_m", label: "Rohit", emoji: "🧔", lang: "Hindi", gender: "male" },
    { id: "startup_m", label: "Dev Bhai", emoji: "🚀", lang: "Hinglish", gender: "male" },
    { id: "anchor_m", label: "Anchor", emoji: "📺", lang: "Hindi", gender: "male" },
    { id: "arjun_m", label: "Arjun", emoji: "🧔", lang: "English", gender: "male" },
  ].filter((v) => v.gender === presenterGender);

  return (
    <AppShell>
      <div
        style={{
          maxWidth: 680,
          margin: "0 auto",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(26px,3vw,36px)",
              color: "var(--ink)",
              marginBottom: 4,
            }}
          >
            MEESHO PRODUCT AD
          </h1>
          <p style={{ color: "var(--ink-2)", fontSize: 15 }}>
            Paste a Meesho link — AI writes the script, voices it, and
            composes a 30s ad video
          </p>
          {credits !== null && (
            <p
              style={{
                marginTop: 6,
                fontSize: 13,
                fontWeight: 700,
                color: credits < 3 ? "#E53935" : "var(--muted)",
                fontFamily: "var(--font-body)",
              }}
            >
              You have {credits} credit{credits !== 1 ? "s" : ""} &bull;
              Product ads cost 3 credits
            </p>
          )}
        </div>

        {/* URL input */}
        <SectionCard
          label="Meesho Product URL"
          sublabel="Paste the link from meesho.com"
        >
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setScrapeError(null);
                if (product) setProduct(null);
              }}
              placeholder="https://meesho.com/product/..."
              className="input-field"
              style={{ flex: 1 }}
            />
            <button
              onClick={handleScrape}
              disabled={scraping || !url.trim()}
              className="btn-hard"
              style={{
                padding: "10px 20px",
                fontSize: 14,
                whiteSpace: "nowrap",
                opacity: scraping || !url.trim() ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              {scraping ? (
                <>
                  <span
                    className="spin"
                    style={{
                      width: 14,
                      height: 14,
                      border: "2px solid rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      borderRadius: "50%",
                      display: "inline-block",
                      marginRight: 6,
                    }}
                  />
                  Fetching...
                </>
              ) : (
                "Fetch Product"
              )}
            </button>
          </div>
          {scrapeError && (
            <p
              style={{
                marginTop: 8,
                fontSize: 13,
                color: "#E53935",
                fontWeight: 600,
                fontFamily: "var(--font-body)",
              }}
            >
              {scrapeError}
            </p>
          )}
        </SectionCard>

        {/* Product preview */}
        {product && (
          <ProductPreviewCard
            product={product}
            onClear={() => {
              setProduct(null);
              setOverrideName("");
              setOverridePrice("");
              setOverrideMrp("");
              setOverrideDescription("");
            }}
          />
        )}

        {/* Manual override fields — shown when scrape_partial */}
        {product?.scrape_partial && (
          <SectionCard
            label="Fill Product Details"
            sublabel="Auto-scrape could not read all fields. Please fill them in."
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--ink)",
                    fontFamily: "var(--font-body)",
                    display: "block",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Product Name *
                </label>
                <input
                  type="text"
                  value={overrideName}
                  onChange={(e) => setOverrideName(e.target.value)}
                  placeholder="e.g. Cotton A-line Kurti"
                  className="input-field"
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--ink)",
                      fontFamily: "var(--font-body)",
                      display: "block",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={overridePrice}
                    onChange={(e) => setOverridePrice(e.target.value)}
                    placeholder="e.g. 299"
                    min={0}
                    className="input-field"
                  />
                </div>
                <div>
                  <label
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--ink)",
                      fontFamily: "var(--font-body)",
                      display: "block",
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={overrideMrp}
                    onChange={(e) => setOverrideMrp(e.target.value)}
                    placeholder="e.g. 599"
                    min={0}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: "var(--ink)",
                    fontFamily: "var(--font-body)",
                    display: "block",
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Product Description
                </label>
                <textarea
                  value={overrideDescription}
                  onChange={(e) => setOverrideDescription(e.target.value)}
                  placeholder="What does it do? e.g. Organizes polythene bags, fits in kitchen drawer, holds 50+ bags"
                  className="input-field"
                  rows={3}
                  style={{ resize: "vertical", minHeight: 72 }}
                />
              </div>
            </div>
          </SectionCard>
        )}

        {/* Language */}
        {product && (
          <SectionCard label="Script Language">
            <div style={{ display: "flex", gap: 10 }}>
              {(
                [
                  { value: "hi", label: "हिंदी", sublabel: "Pure Hindi" },
                  { value: "hinglish", label: "Hinglish", sublabel: "Hindi + English mix" },
                ] as const
              ).map((l) => (
                <button
                  key={l.value}
                  onClick={() => setLanguage(l.value)}
                  style={{
                    flex: 1,
                    padding: "12px 10px",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    textAlign: "center",
                    transition: "all 0.08s ease",
                    ...sel(language === l.value),
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{l.label}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                    {l.sublabel}
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Presenter gender */}
        {product && (
          <SectionCard
            label="Presenter"
            sublabel="AI-generated presenter for the ad"
          >
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              {(
                [
                  { value: "female", emoji: "👩", label: "Female Presenter" },
                  { value: "male", emoji: "🧔", label: "Male Presenter" },
                ] as const
              ).map((g) => (
                <button
                  key={g.value}
                  onClick={() => handlePresenterGender(g.value)}
                  style={{
                    flex: 1,
                    padding: "12px 10px",
                    borderRadius: "var(--r-sm)",
                    cursor: "pointer",
                    fontFamily: "var(--font-body)",
                    textAlign: "center",
                    transition: "all 0.08s ease",
                    ...sel(presenterGender === g.value),
                  }}
                >
                  <div style={{ fontSize: 26, marginBottom: 4 }}>{g.emoji}</div>
                  <div style={{ fontWeight: 800, fontSize: 13 }}>{g.label}</div>
                </button>
              ))}
            </div>

            {/* Voice picker */}
            <div style={{ borderTop: "1.5px solid var(--ink)", paddingTop: 14 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  color: "var(--muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 10,
                  fontFamily: "var(--font-body)",
                }}
              >
                Voice
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2,1fr)",
                  gap: 8,
                }}
              >
                {voices.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoiceId(v.id)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "var(--r-sm)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      fontFamily: "var(--font-body)",
                      transition: "all 0.08s ease",
                      ...sel(voiceId === v.id),
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{v.emoji}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 13 }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{v.lang}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Error */}
        {submitError && (
          <div
            style={{
              background: "var(--orange-lt, #FFF3E0)",
              border: "2px solid var(--orange)",
              borderRadius: "var(--r-sm)",
              padding: "12px 16px",
              fontSize: 14,
              color: "var(--orange-dark, #E65100)",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
          >
            {submitError}
          </div>
        )}

        {/* Generate CTA */}
        {product && (
          <button
            onClick={handleGenerate}
            disabled={submitting || !canGenerate}
            className="btn-hard"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: 18,
              justifyContent: "center",
              opacity: submitting || !canGenerate ? 0.5 : 1,
            }}
          >
            {submitting ? (
              <>
                <span
                  className="spin"
                  style={{
                    width: 22,
                    height: 22,
                    border: "3px solid rgba(255,255,255,0.3)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    display: "inline-block",
                  }}
                />
                Starting...
              </>
            ) : (
              "Generate Ad Video (3 credits)"
            )}
          </button>
        )}

        {product && (
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: "var(--muted)",
              fontFamily: "var(--font-body)",
            }}
          >
            Takes ~60 seconds &bull; AI presenter + product images + price badge
          </p>
        )}

        {/* Empty state hint */}
        {!product && !scraping && (
          <div
            style={{
              border: "2px dashed var(--ink)",
              borderRadius: "var(--r-sm)",
              padding: "32px 24px",
              textAlign: "center",
              opacity: 0.5,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛍️</div>
            <p
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--ink)",
                marginBottom: 4,
              }}
            >
              Paste a Meesho link above
            </p>
            <p style={{ fontSize: 13, color: "var(--muted)" }}>
              Product details will be auto-fetched
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
