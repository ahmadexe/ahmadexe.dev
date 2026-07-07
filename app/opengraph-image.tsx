import { ImageResponse } from "next/og";

export const alt = "Muhammad Ahmad – Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#000000",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Grid lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(0,255,65,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,65,0.04) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#00ff41",
              boxShadow: "0 0 12px #00ff41",
            }}
          />
          <span
            style={{
              color: "rgba(0,255,65,0.5)",
              fontSize: "13px",
              letterSpacing: "0.4em",
              textTransform: "uppercase",
            }}
          >
            TERMOLIO.CRT · ahmadexe@portfolio
          </span>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#00bcd4", fontSize: "22px" }}>
              ahmadexe@termolio
            </span>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "22px" }}>
              :~$
            </span>
            <span style={{ color: "#00ff41", fontSize: "22px" }}>whoami</span>
          </div>

          <div
            style={{
              color: "#ffffff",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.01em",
            }}
          >
            Muhammad Ahmad
          </div>

          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: "26px",
              letterSpacing: "0.02em",
            }}
          >
            Software Engineer · Go · Flutter · AI Agents · Blockchain
          </div>

          <div
            style={{
              display: "flex",
              gap: "24px",
              marginTop: "8px",
              flexWrap: "wrap",
            }}
          >
            {["Agenix", "PRISM Chain", "ICT Innovation Global Winner", "Islamabad, PK"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    border: "1px solid rgba(0,255,65,0.35)",
                    color: "#00ff41",
                    padding: "4px 14px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    letterSpacing: "0.08em",
                    background: "rgba(0,255,65,0.06)",
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: "14px",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
            }}
          >
            ahmadexe.dev
          </span>
          <span
            style={{
              color: "rgba(0,255,65,0.4)",
              fontSize: "13px",
              letterSpacing: "0.2em",
            }}
          >
            PID 0x0AE1 · UTF-8
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
