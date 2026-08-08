import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { biya, brand, font } from "../theme";
import {
  ImageSlot,
  LP_BP,
  LandingMark,
  Reveal,
  bigTitle,
  darkPanel,
  eyebrow,
  hookTitle,
  lead,
  panelScrim,
  sectionPad,
  title,
} from "./parts";

/**
 * The nine sections, in the order the design sets them:
 * hook, the account, scan and pay, transfer and request, the assistant,
 * scheduled payments, business, the rate, get the app.
 *
 * Photography slots are empty pending real photographs. See ImageSlot.
 */

export type Enter = (intent: "signup" | "login") => void;

const mono = (size: number, color: string): React.CSSProperties => ({
  fontFamily: font.mono,
  fontSize: size,
  fontWeight: 400,
  lineHeight: 1.4,
  color,
});

const sans = (
  size: number,
  weight: number,
  color: string,
  lineHeight = 1.2,
): React.CSSProperties => ({
  fontFamily: font.sans,
  fontSize: size,
  fontWeight: weight,
  lineHeight,
  color,
});

const capsMono: React.CSSProperties = { letterSpacing: ".08em", textTransform: "uppercase" };

// --- 01 Hook ----------------------------------------------------------------

export function Hook({ onEnter }: { onEnter: Enter }) {
  return (
    <section
      style={{
        position: "relative",
        minHeight: "clamp(640px,86vh,760px)",
        marginTop: -64,
        background: brand.night,
        overflow: "hidden",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      {/* Two crops, not two sizes. The hero is roughly 0.54 wide-to-tall on a
          phone and 1.68 on a desktop, so one file centre-cropped to both throws
          away most of one of them. The portrait frame keeps the trader and the
          POS stall on a phone; the landscape frame is barely cropped at all on
          a desktop. See scripts/make-photos.mjs. */}
      <Reveal kind="zoom" style={{ position: "absolute", inset: 0 }}>
        <ImageSlot
          priority
          alt="A trader at her stall in a Nigerian market, tomatoes and peppers laid out in front of her"
          sources={[
            {
              media: `(min-width:${LP_BP}px)`,
              srcSet:
                "/photos/hero-landscape-1600.webp 1600w, /photos/hero-landscape-2400.webp 2400w",
            },
          ]}
          src="/photos/hero-portrait-900.webp"
          srcSet="/photos/hero-portrait-900.webp 900w, /photos/hero-portrait-1600.webp 1600w"
        />
      </Reveal>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(rgba(12,14,18,.5) 0%,rgba(12,14,18,.11) 33%,rgba(12,14,18,.93) 86%)",
        }}
      />
      <div
        className="lp-wrap"
        style={{
          position: "relative",
          width: "100%",
          padding: "0 clamp(22px,4vw,44px) clamp(40px,7vh,80px)",
        }}
      >
        <Reveal delay={0} style={{ ...eyebrow("rgba(255,255,255,.62)"), marginBottom: 17 }}>
          Samaru, Zaria
        </Reveal>
        <Reveal delay={70} style={{ ...hookTitle, maxWidth: "14ch" }}>
          Hold dollars. Get paid in naira.
        </Reveal>
        <Reveal delay={140} style={{ marginTop: 27 }}>
          <button
            onClick={() => onEnter("signup")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              maxWidth: 420,
              minHeight: 58,
              padding: "0 30px",
              borderRadius: 15,
              background: biya.action,
              ...sans(17, 600, brand.white, 1),
              border: "none",
              cursor: "pointer",
            }}
          >
            Open an account
          </button>
        </Reveal>
      </div>
    </section>
  );
}

// --- 02 The account ---------------------------------------------------------

function PhoneMock() {
  return (
    <div
      style={{
        position: "relative",
        width: "min(300px,100%)",
        margin: "0 auto",
        background: brand.white,
        borderRadius: 32,
        overflow: "hidden",
        boxShadow: "0 30px 70px rgba(0,0,0,.42)",
      }}
    >
      <div
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 22px",
          ...sans(13, 600, biya.ink, 1),
        }}
      >
        <span>10:24</span>
        <span style={{ ...mono(11, biya.muted), lineHeight: 1 }}>LTE 84%</span>
      </div>
      <div style={{ background: biya.ground, paddingBottom: 22 }}>
        <div style={{ padding: "12px 20px 0" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 9,
              background: brand.white,
              border: `1px solid ${biya.line}`,
              borderRadius: 999,
              padding: "5px 13px 5px 5px",
            }}
          >
            <span
              style={{
                width: 27,
                height: 27,
                borderRadius: "50%",
                background: biya.ink,
                color: brand.white,
                ...sans(11, 600, brand.white),
                lineHeight: "27px",
                textAlign: "center",
              }}
            >
              HA
            </span>
            <span style={{ ...sans(13, 600, biya.ink, 1) }}>Personal</span>
          </span>
        </div>

        <div style={{ padding: "28px 20px 0" }}>
          <div style={{ ...mono(11, biya.faint), ...capsMono }}>Your dollars</div>
          <div
            style={{
              ...sans(48, 700, biya.ink, 1),
              letterSpacing: "-.04em",
              marginTop: 10,
            }}
          >
            $482.60
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 10,
              flexWrap: "wrap",
            }}
          >
            <span style={{ ...sans(17, 600, biya.inkSoft, 1) }}>₦747,161.32</span>
            <span style={{ ...mono(11, biya.faint), lineHeight: 1 }}>@ ₦1,548.20 · 10:24</span>
          </div>
        </div>

        <div style={{ padding: "22px 20px 0", display: "flex", gap: 8 }}>
          {["Request", "Add money"].map((label) => (
            <div
              key={label}
              style={{
                flex: 1,
                minHeight: 44,
                borderRadius: 12,
                background: brand.white,
                border: `1px solid ${biya.line}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...sans(13, 600, biya.ink, 1),
              }}
            >
              {label}
            </div>
          ))}
        </div>

        <div style={{ padding: "26px 20px 0" }}>
          <div style={{ ...sans(16, 600, biya.ink, 1), marginBottom: 12 }}>Activity</div>
          <div
            style={{
              background: brand.white,
              border: `1px solid ${biya.line}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 15px",
                borderBottom: `1px solid ${biya.hairline}`,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: biya.avatar,
                  ...sans(13, 600, biya.inkSoft),
                  lineHeight: "38px",
                  textAlign: "center",
                  flex: "none",
                }}
              >
                IB
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...sans(14, 600, biya.ink) }}>Iya Basira</div>
                <div style={{ ...sans(11.5, 400, biya.faint, 1.4), marginTop: 3 }}>
                  14:02 · Paid by code
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ ...sans(14, 600, biya.ink) }}>−$0.46</div>
                <div style={{ ...mono(11, biya.faint), marginTop: 2 }}>₦700.00</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px" }}>
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  background: biya.creditWash,
                  ...sans(13, 600, biya.credit),
                  lineHeight: "38px",
                  textAlign: "center",
                  flex: "none",
                }}
              >
                CE
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...sans(14, 600, biya.ink) }}>Chinaza Eze</div>
                <div style={{ ...sans(11.5, 400, biya.faint, 1.4), marginTop: 3 }}>
                  09:41 · Sent you dollars
                </div>
              </div>
              <div style={{ ...sans(14, 600, biya.credit) }}>+$25.00</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Account() {
  return (
    <section style={{ background: biya.ground, padding: sectionPad }}>
      <div className="lp-wrap lp-two">
        <div>
          <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
            Your account
          </Reveal>
          <Reveal delay={70} style={bigTitle(biya.ink)}>
            Your money keeps its value overnight.
          </Reveal>
          <Reveal delay={140} style={{ ...lead(biya.muted), marginTop: 18, maxWidth: "44ch" }}>
            Dollars in your account. Naira wherever you spend, at the rate you can see.
          </Reveal>
        </div>

        <Reveal
          delay={120}
          style={{ ...darkPanel, padding: "clamp(30px,5vw,52px) clamp(18px,4vw,40px)" }}
        >
          <ImageSlot /* Woman checking her phone outside a shop in Zaria */ />
          <div
            style={{
              ...panelScrim,
              background: "linear-gradient(rgba(12,14,18,.3),rgba(12,14,18,.56))",
            }}
          />
          <PhoneMock />
        </Reveal>
      </div>
    </section>
  );
}

// --- 03 Scan and pay --------------------------------------------------------

/**
 * A shop's collection code, the thing a customer actually points a phone at.
 *
 * Drawn rather than photographed. The reference was a 334x405 screenshot, and
 * this box is up to 550px wide on a desktop, so using it directly would have
 * meant upscaling a raster by nearly two and looking soft and washed out. The
 * QR here is an SVG, so it is exact at any size and still scans. Value, level
 * and the centred mark match what ReceiveMode renders inside the app, so the
 * page is not showing a code the product would not produce.
 */
function CollectionCard() {
  const code = "8894612247";
  return (
    <div
      style={{
        width: "min(260px,82%)",
        background: brand.white,
        borderRadius: 22,
        padding: "20px 20px 22px",
        boxShadow: "0 24px 54px rgba(0,0,0,.34)",
      }}
    >
      <div style={{ position: "relative", width: "100%", aspectRatio: "1", background: brand.white }}>
        <QRCodeSVG
          value={code}
          size={256}
          level="Q"
          bgColor={brand.white}
          fgColor={biya.ink}
          style={{ width: "100%", height: "100%" }}
        />
        {/* Level Q tolerates about 25 percent occlusion, which is what lets the
            mark sit in the middle without breaking the read. */}
        <span
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: "23%",
            height: "23%",
            borderRadius: "24%",
            background: biya.ink,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: `2.5px solid ${brand.white}`,
          }}
        >
          <LandingMark size={17} tone={brand.white} />
        </span>
      </div>

      <div
        style={{
          ...sans(16, 700, biya.ink, 1.22),
          letterSpacing: "-.01em",
          textTransform: "uppercase",
          marginTop: 18,
        }}
      >
        ASM Global General Enterprises
      </div>
      <div style={{ ...mono(12, biya.action), marginTop: 8 }}>@asmglobalgeneralenterprises</div>
      <div style={{ ...mono(13, biya.faint), letterSpacing: ".08em", marginTop: 8 }}>{code}</div>
    </div>
  );
}

export function ScanAndPay() {
  return (
    <section style={{ background: brand.white, padding: sectionPad }}>
      <div className="lp-wrap lp-two lp-two-media-left">
        <div>
          <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
            How paying works
          </Reveal>
          <Reveal delay={70} style={title(biya.ink)}>
            Point at the code. See the naira before you pay.
          </Reveal>
        </div>

        <Reveal delay={120} style={{ position: "relative", paddingBottom: 44 }}>
          <div
            className="lp-scan-media"
            style={{
              position: "relative",
              borderRadius: 24,
              overflow: "hidden",
              background: brand.night,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 22,
            }}
          >
            <CollectionCard />
          </div>
          <div
            style={{
              position: "absolute",
              right: "clamp(8px,3%,16px)",
              bottom: 0,
              width: "min(196px,52%)",
              background: brand.white,
              borderRadius: 22,
              border: `1px solid ${biya.lineStrong}`,
              boxShadow: "0 24px 54px rgba(14,17,22,.2)",
              padding: "16px 16px 18px",
            }}
          >
            <div style={{ ...mono(10, biya.faint), ...capsMono }}>Paying</div>
            <div style={{ ...sans(15, 600, biya.ink), marginTop: 6 }}>Iya Basira</div>
            <div
              style={{ ...sans(30, 700, biya.ink, 1), letterSpacing: "-.03em", marginTop: 12 }}
            >
              ₦700.00
            </div>
            <div style={{ ...mono(11, biya.faint), marginTop: 7 }}>$0.46 · @ ₦1,548.20</div>
            <div
              style={{
                marginTop: 14,
                minHeight: 44,
                borderRadius: 12,
                background: biya.action,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                ...sans(13, 600, brand.white, 1),
              }}
            >
              Slide to pay
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 04 Transfer and request ------------------------------------------------

function MiniField({
  label,
  value,
  valueMono,
  note,
}: {
  label: string;
  value: string;
  valueMono?: boolean;
  note?: string;
}) {
  return (
    <div style={{ background: biya.ground, borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ ...mono(10, biya.faint), ...capsMono }}>{label}</div>
      <div
        style={{
          ...(valueMono ? mono(15, biya.ink) : sans(15, 600, biya.ink)),
          fontWeight: 600,
          marginTop: 5,
        }}
      >
        {value}
      </div>
      {note && (
        <div style={{ ...sans(12, 400, biya.credit, 1.3), marginTop: 6 }}>{note}</div>
      )}
    </div>
  );
}

export function TransferAndRequest() {
  return (
    <section style={{ background: biya.ground, padding: sectionPad }}>
      <div className="lp-wrap">
        <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
          Transfer and request
        </Reveal>
        <Reveal delay={70} style={{ ...title(biya.ink), maxWidth: "20ch" }}>
          No code? Send to any bank, or ask to be paid.
        </Reveal>

        <Reveal
          delay={110}
          style={{
            ...darkPanel,
            marginTop: "clamp(32px,5vw,64px)",
            padding: "clamp(22px,4vw,44px) clamp(18px,4vw,44px)",
          }}
        >
          <ImageSlot /* Two friends looking at a phone together, warm daylight */ />
          <div style={panelScrim} />
          <div className="lp-duo" style={{ position: "relative" }}>
            <div
              style={{
                background: brand.white,
                border: `1px solid ${biya.line}`,
                borderRadius: 24,
                padding: "clamp(22px,4vw,26px) clamp(18px,3vw,24px)",
              }}
            >
              <div style={{ ...sans(17, 600, biya.ink, 1) }}>Manual transfer</div>
              <div
                style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}
              >
                <MiniField label="Bank" value="Guaranty Trust Bank" />
                <MiniField
                  label="Account"
                  value="0123456789"
                  valueMono
                  note="Musa Abdullahi · matched"
                />
                <div
                  style={{
                    background: biya.ground,
                    borderRadius: 14,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "baseline",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <span
                    style={{ ...sans(24, 700, biya.ink, 1), letterSpacing: "-.03em" }}
                  >
                    ₦25,000
                  </span>
                  <span style={{ ...mono(11, biya.faint), lineHeight: 1 }}>$16.27</span>
                </div>
              </div>
            </div>

            <div
              style={{
                background: brand.white,
                border: `1px solid ${biya.line}`,
                borderRadius: 24,
                padding: "clamp(22px,4vw,26px) clamp(18px,3vw,24px)",
              }}
            >
              <div style={{ ...sans(17, 600, biya.ink, 1) }}>Request money</div>
              <div
                style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 10 }}
              >
                <div
                  style={{
                    background: biya.ground,
                    borderRadius: 14,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: biya.ink,
                      ...sans(13, 600, brand.white),
                      lineHeight: "38px",
                      textAlign: "center",
                      flex: "none",
                    }}
                  >
                    CE
                  </span>
                  <div>
                    <div style={{ ...sans(15, 600, biya.ink) }}>Chinaza Eze</div>
                    <div style={{ ...sans(12, 400, biya.faint, 1.3), marginTop: 3 }}>
                      Requested $25.00
                    </div>
                  </div>
                </div>
                <div style={{ background: biya.ground, borderRadius: 14, padding: 16 }}>
                  <div style={{ ...mono(10, biya.faint), ...capsMono }}>Note</div>
                  <div style={{ ...sans(14, 400, biya.inkSoft, 1.4), marginTop: 5 }}>
                    For the generator fuel, no rush
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <div
                    style={{
                      flex: 1,
                      minHeight: 46,
                      borderRadius: 12,
                      background: biya.action,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      ...sans(14, 600, brand.white, 1),
                    }}
                  >
                    Send request
                  </div>
                  <div
                    style={{
                      width: 46,
                      minHeight: 46,
                      borderRadius: 12,
                      background: biya.ground,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 4,
                          height: 4,
                          borderRadius: "50%",
                          background: biya.inkSoft,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 05 The assistant -------------------------------------------------------

export function Assistant() {
  return (
    <section style={{ background: brand.white, padding: sectionPad }}>
      <div className="lp-wrap lp-two">
        <div>
          <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
            The assistant
          </Reveal>
          <Reveal delay={70} style={title(biya.ink)}>
            Say what you want to do. It does it.
          </Reveal>
        </div>

        <Reveal delay={120} style={{ ...darkPanel, padding: "clamp(24px,4vw,44px) clamp(18px,3vw,32px)" }}>
          <ImageSlot /* Close crop of a hand typing on a phone, evening light */ />
          <div
            style={{
              ...panelScrim,
              background: "linear-gradient(rgba(12,14,18,.36),rgba(12,14,18,.63))",
            }}
          />
          <div
            style={{
              position: "relative",
              width: "min(340px,100%)",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div
              style={{
                alignSelf: "flex-end",
                maxWidth: "84%",
                background: biya.action,
                borderRadius: "18px 18px 4px 18px",
                padding: "13px 16px",
                ...sans(15, 400, brand.white, 1.4),
              }}
            >
              Send Musa ₦25,000
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                maxWidth: "90%",
                background: brand.white,
                border: `1px solid ${biya.line}`,
                borderRadius: "18px 18px 18px 4px",
                padding: "13px 16px",
                ...sans(15, 400, biya.inkSoft, 1.4),
              }}
            >
              That is $16.27 at today's rate. Ready when you are.
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                width: "90%",
                background: brand.white,
                border: `1px solid ${biya.line}`,
                borderRadius: 18,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span style={{ ...sans(15, 600, biya.ink) }}>Musa Abdullahi</span>
                <span
                  style={{ ...sans(18, 700, biya.ink, 1), letterSpacing: "-.02em" }}
                >
                  ₦25,000
                </span>
              </div>
              <div style={{ ...mono(11, biya.faint), marginTop: 6 }}>
                GTBank 0123456789 · $16.27
              </div>
              <div
                style={{
                  marginTop: 14,
                  minHeight: 46,
                  borderRadius: 12,
                  background: biya.action,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...sans(14, 600, brand.white, 1),
                }}
              >
                Confirm
              </div>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: brand.white,
                border: `1px solid ${biya.line}`,
                borderRadius: 999,
                padding: "12px 16px",
                marginTop: 4,
              }}
            >
              <span style={{ flex: 1, ...sans(14, 400, biya.faint, 1) }}>
                Ask Biya anything
              </span>
              <span
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: biya.ink,
                  ...sans(14, 600, brand.white),
                  lineHeight: "32px",
                  textAlign: "center",
                  flex: "none",
                }}
              >
                ↑
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 06 Scheduled payments --------------------------------------------------

const SCHEDULED: { name: string; when: string; ngn: string; usd: string; dot: string }[] = [
  {
    name: "Rent, Mallam Sani",
    when: "Every 1st · next 1 September",
    ngn: "₦180,000",
    usd: "≈ $117.14",
    dot: biya.action,
  },
  {
    name: "School fees, Amina",
    when: "Every term · next 14 September",
    ngn: "₦95,000",
    usd: "≈ $61.82",
    dot: biya.action,
  },
  {
    name: "Data, Airtel",
    when: "Every Monday · next tomorrow",
    ngn: "₦3,500",
    usd: "≈ $2.28",
    dot: biya.pending,
  },
];

export function Scheduled({ onEnter }: { onEnter: Enter }) {
  return (
    <section style={{ background: biya.ground, padding: sectionPad }}>
      <div className="lp-wrap lp-sched">
        <div className="lp-sched-head">
          <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
            Scheduled payments
          </Reveal>
          <Reveal delay={70} style={title(biya.ink)}>
            Rent and fees leave on their own day.
          </Reveal>
        </div>

        <Reveal
          className="lp-sched-media"
          delay={120}
          style={{ ...darkPanel, padding: "clamp(24px,4vw,44px) clamp(18px,3vw,32px)" }}
        >
          <ImageSlot /* A landlord's receipt book and a phone on a table */ />
          <div style={panelScrim} />
          <div
            style={{
              position: "relative",
              background: brand.white,
              borderRadius: 22,
              overflow: "hidden",
              boxShadow: "0 24px 54px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                padding: "22px 22px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ ...sans(16, 600, biya.ink, 1) }}>Scheduled</span>
              <span style={{ ...mono(11, biya.faint), lineHeight: 1 }}>3 active</span>
            </div>
            {SCHEDULED.map((row) => (
              <div
                key={row.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 13,
                  padding: "16px 22px",
                  borderTop: "1px solid rgba(14,17,22,.07)",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: row.dot,
                    flex: "none",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ ...sans(15, 600, biya.ink) }}>{row.name}</div>
                  <div style={{ ...sans(12, 400, biya.faint, 1.4), marginTop: 3 }}>
                    {row.when}
                  </div>
                </div>
                <div style={{ textAlign: "right", flex: "none" }}>
                  <div style={{ ...sans(15, 600, biya.ink) }}>{row.ngn}</div>
                  <div style={{ ...mono(10, biya.faint), marginTop: 2 }}>{row.usd}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="lp-sched-cta" delay={140}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => onEnter("signup")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 52,
                padding: "0 24px",
                borderRadius: 14,
                background: biya.ink,
                ...sans(16, 600, brand.white, 1),
                border: "none",
                cursor: "pointer",
              }}
            >
              Open an account
            </button>
            <span style={{ ...sans(13, 400, biya.faint, 1.4) }}>
              Works in any phone browser
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 07 Business ------------------------------------------------------------

const BARS = [34, 52, 41, 68, 84, 60, 100];

export function Business() {
  return (
    <section style={{ background: brand.white, padding: sectionPad }}>
      <div className="lp-wrap lp-two">
        <div>
          <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
            For businesses
          </Reveal>
          <Reveal delay={70} style={title(biya.ink)}>
            One code on the counter. Every sale in one place.
          </Reveal>
        </div>

        <Reveal delay={120} style={{ ...darkPanel, padding: "clamp(24px,4vw,44px) clamp(18px,3vw,32px)" }}>
          <ImageSlot /* A market vendor behind her counter, printed Biya code taped to the front */ />
          <div
            style={{
              ...panelScrim,
              background: "linear-gradient(rgba(12,14,18,.34),rgba(12,14,18,.62))",
            }}
          />
          <div
            style={{
              position: "relative",
              background: brand.white,
              borderRadius: 22,
              padding: "24px 22px 26px",
              boxShadow: "0 24px 54px rgba(0,0,0,.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 9,
                    background: biya.action,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <LandingMark size={18} tone={brand.white} />
                </span>
                <span style={{ ...sans(14, 600, biya.ink, 1) }}>Basira Foods</span>
              </span>
              <span style={{ ...mono(11, biya.faint), lineHeight: 1 }}>Today</span>
            </div>

            <div style={{ ...mono(10, biya.faint), ...capsMono, marginTop: 22 }}>Collected</div>
            <div
              style={{
                fontFamily: font.sans,
                fontSize: "clamp(36px,4vw,44px)",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-.04em",
                color: biya.ink,
                marginTop: 8,
              }}
            >
              ₦146,400
            </div>
            <div style={{ ...mono(12, biya.faint), lineHeight: 1, marginTop: 9 }}>
              $94.56 · 38 payments
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 6,
                height: 72,
                marginTop: 24,
              }}
            >
              {BARS.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: h === 100 ? biya.action : biya.actionWash,
                    borderRadius: 4,
                  }}
                />
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: 23,
                background: biya.ground,
                borderRadius: 16,
                padding: "14px 15px",
              }}
            >
              <span
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: biya.ink,
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"
                    fill={brand.white}
                  />
                </svg>
              </span>
              <div>
                <div style={{ ...sans(14, 600, biya.ink) }}>Your collection code</div>
                <div style={{ ...sans(12, 400, biya.faint, 1.3), marginTop: 3 }}>
                  Print it, tape it, get paid
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// --- 08 The rate ------------------------------------------------------------

/**
 * The pricing shown here is the pricing the ledger actually charges: 0.75 percent,
 * set in fx_config.margin_bps and rendered as its own line on the review screen.
 * $16.27 is what ₦25,000 costs once that margin is applied to a ₦1,548.20 mid.
 */
const RATE_ROWS: [string, string][] = [
  ["You send", "$16.27"],
  ["Biya fee, 0.75%", "$0.12"],
  ["Rate locked for", "90 seconds"],
];

export function Rate() {
  return (
    <section style={{ background: biya.ink, padding: sectionPad }}>
      <div className="lp-wrap">
        <Reveal delay={0} style={{ ...eyebrow("rgba(255,255,255,.5)"), marginBottom: 18 }}>
          The rate
        </Reveal>
        <Reveal delay={70} style={{ ...title(brand.white), maxWidth: "18ch" }}>
          We show you the rate. We do not claim it.
        </Reveal>

        <Reveal
          delay={140}
          style={{
            marginTop: "clamp(32px,5vw,60px)",
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.14)",
            borderRadius: 24,
            padding: "clamp(24px,3vw,32px) clamp(20px,3vw,32px)",
            maxWidth: 620,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 14,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                ...mono(12, "rgba(255,255,255,.5)"),
                ...capsMono,
                lineHeight: 1,
              }}
            >
              Live rate
            </span>
            <span
              style={{
                fontFamily: font.sans,
                fontSize: "clamp(30px,3.4vw,38px)",
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: "-.03em",
                color: brand.white,
              }}
            >
              ₦1,548.20
            </span>
          </div>

          <div style={{ height: 1, background: "rgba(255,255,255,.14)", margin: "20px 0" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {RATE_ROWS.map(([label, value]) => (
              <div
                key={label}
                style={{ display: "flex", justifyContent: "space-between", gap: 16 }}
              >
                <span style={{ ...sans(15, 400, "rgba(255,255,255,.62)", 1) }}>{label}</span>
                <span style={{ ...sans(15, 600, brand.white, 1) }}>{value}</span>
              </div>
            ))}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 16,
                paddingTop: 14,
                borderTop: "1px solid rgba(255,255,255,.14)",
              }}
            >
              <span style={{ ...sans(15, 600, brand.white, 1) }}>They receive</span>
              <span style={{ ...sans(17, 700, brand.white, 1) }}>₦25,000.00</span>
            </div>
          </div>
        </Reveal>

        <Reveal
          delay={200}
          style={{
            marginTop: 24,
            ...mono(13, "rgba(255,255,255,.42)"),
            lineHeight: 1.6,
            maxWidth: "60ch",
          }}
        >
          The rate you see comes from a live bank feed, not from us. It is locked for ninety
          seconds when you pay, and if we cannot reach a fresh rate we will not quote one.
        </Reveal>
      </div>
    </section>
  );
}

// --- 09 Get the app ---------------------------------------------------------

const FOOTER_LINKS = ["For vendors", "Rates", "Support", "Terms", "Privacy"];

export function GetTheApp({ onEnter }: { onEnter: Enter }) {
  // Whatever origin the page is being served from, so the code cannot go stale
  // the way a generated image would.
  const url = typeof window === "undefined" ? "https://biya.app" : window.location.origin;

  return (
    <section
      id="get-the-app"
      style={{
        background: biya.ground,
        padding: "clamp(76px,10vw,130px) clamp(22px,4vw,44px) clamp(48px,7vw,90px)",
      }}
    >
      <div className="lp-wrap lp-two lp-app">
        <div>
          <Reveal delay={0} style={{ ...eyebrow(biya.faint), marginBottom: 18 }}>
            Get the app
          </Reveal>
          <Reveal delay={70} style={bigTitle(biya.ink)}>
            Open an account in about three minutes.
          </Reveal>
          <Reveal delay={140} className="lp-cta-row" style={{ marginTop: 30 }}>
            <button
              onClick={() => onEnter("signup")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 11,
                minHeight: 58,
                padding: "0 26px",
                borderRadius: 15,
                background: biya.ink,
                border: "none",
                cursor: "pointer",
              }}
            >
              <LandingMark size={20} tone={brand.white} />
              <span style={{ ...sans(16, 600, brand.white, 1.2) }}>Open an account</span>
            </button>
            <button
              onClick={() => onEnter("login")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 58,
                padding: "0 26px",
                borderRadius: 15,
                background: brand.white,
                border: `1px solid ${biya.lineStrong}`,
                cursor: "pointer",
              }}
            >
              <span style={{ ...sans(16, 600, biya.ink, 1.2) }}>I already have an account</span>
            </button>
          </Reveal>
        </div>

        {/* Desktop only. On a phone you are already holding the device the code
            would send you to, so the mobile design leaves it out. */}
        <Reveal
          className="lp-qr"
          delay={120}
          style={{
            background: brand.white,
            border: `1px solid ${biya.line}`,
            borderRadius: 24,
            padding: 28,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 150,
              height: 150,
              margin: "0 auto",
              borderRadius: 16,
              overflow: "hidden",
              background: brand.white,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <QRCodeSVG
              value={url}
              size={150}
              level="M"
              bgColor={brand.white}
              fgColor={biya.ink}
            />
          </div>
          <div style={{ ...mono(12, biya.faint), lineHeight: 1.6, marginTop: 18 }}>
            Scan to open Biya on your phone
          </div>
        </Reveal>
      </div>

      <div
        className="lp-wrap lp-foot"
        style={{
          marginTop: "clamp(48px,7vw,90px)",
          paddingTop: 26,
          borderTop: `1px solid ${biya.line}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LandingMark size={22} tone={biya.ink} />
          <span
            style={{ ...sans(16, 700, biya.ink, 1), letterSpacing: "-.03em" }}
          >
            Biya
          </span>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "14px 22px",
            ...sans(13, 400, biya.faint, 1),
          }}
        >
          {FOOTER_LINKS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
