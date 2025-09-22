import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const alt = "0Unveiled - AI-Powered Developer Portfolio Platform"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0a0a0a 0%, #141414 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
          position: "relative",
        }}
      >
        {/* Subtle background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(251, 146, 60, 0.1) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(251, 146, 60, 0.05) 0%, transparent 50%)`,
            opacity: 0.3,
          }}
        />

        {/* Main content container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            zIndex: 1,
            maxWidth: "900px",
          }}
        >
          {/* Logo and Brand */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "32px",
              gap: "16px",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                background: "linear-gradient(135deg, #fb923c 0%, #d97706 100%)",
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(251, 146, 60, 0.3)",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#0a0a0a"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <span
              style={{
                fontSize: "56px",
                fontWeight: "700",
                fontFamily: "Manrope",
                color: "#fafafa",
                letterSpacing: "-0.02em",
              }}
            >
              0Unveiled
            </span>
          </div>

          {/* Main Title */}
          <div
            style={{
              fontSize: "72px",
              fontWeight: "700",
              fontFamily: "Manrope",
              textAlign: "center",
              marginBottom: "24px",
              background: "linear-gradient(135deg, #fafafa 0%, #fb923c 50%, #fafafa 100%)",
              backgroundClip: "text",
              color: "transparent",
              lineHeight: "1.1",
              letterSpacing: "-0.025em",
            }}
          >
            Verify Skills.
            <br />
            Build Trust.
            <br />
            <span style={{ color: "#fb923c" }}>Get Hired.</span>
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: "28px",
              fontFamily: "Inter",
              color: "#a3a3a3",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: "1.4",
              marginBottom: "40px",
            }}
          >
            Transform your portfolio into a competitive advantage with AI-powered scoring,
            leaderboards, and job matching.
          </div>

          {/* Feature highlights */}
          <div
            style={{
              display: "flex",
              gap: "24px",
              marginBottom: "40px",
            }}
          >
            <div
              style={{
                background: "rgba(251, 146, 60, 0.1)",
                border: "1px solid rgba(251, 146, 60, 0.2)",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#fb923c",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontSize: "18px",
                  fontFamily: "Inter",
                  color: "#fafafa",
                  fontWeight: "500",
                }}
              >
                AI Scoring
              </span>
            </div>

            <div
              style={{
                background: "rgba(251, 146, 60, 0.1)",
                border: "1px solid rgba(251, 146, 60, 0.2)",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#fb923c",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontSize: "18px",
                  fontFamily: "Inter",
                  color: "#fafafa",
                  fontWeight: "500",
                }}
              >
                Leaderboards
              </span>
            </div>

            <div
              style={{
                background: "rgba(251, 146, 60, 0.1)",
                border: "1px solid rgba(251, 146, 60, 0.2)",
                borderRadius: "12px",
                padding: "16px 24px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  background: "#fb923c",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontSize: "18px",
                  fontFamily: "Inter",
                  color: "#fafafa",
                  fontWeight: "500",
                }}
              >
                Job Matching
              </span>
            </div>
          </div>

          {/* CTA Badge */}
          <div
            style={{
              padding: "12px 32px",
              background: "linear-gradient(135deg, #fb923c 0%, #d97706 100%)",
              color: "#0a0a0a",
              borderRadius: "9999px",
              fontSize: "20px",
              fontWeight: "600",
              fontFamily: "Inter",
              boxShadow: "0 8px 32px rgba(251, 146, 60, 0.4)",
            }}
          >
            🚀 Join the Revolution
          </div>
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    },
  )
}
