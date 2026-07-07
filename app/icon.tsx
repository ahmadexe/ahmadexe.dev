import { ImageResponse } from "next/og";

// Generated favicon: a terminal monogram — bold green "a" with a cyan block
// cursor, reading as "a▮" (ahmadexe on the command line). Legible down to the
// 16px tab size where a wordmark would turn to mush.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          borderRadius: 14,
          border: "3px solid #00ff41",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <span
            style={{
              color: "#00ff41",
              fontSize: 40,
              fontWeight: 800,
              lineHeight: 1,
            }}
          >
            a
          </span>
          <span
            style={{
              width: 9,
              height: 26,
              marginLeft: 3,
              marginBottom: 3,
              background: "#00e5ff",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
