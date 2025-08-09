import { ImageResponse } from "next/og"

// Route segment config
export const runtime = "edge"

// Image metadata
export const alt = "0Unveiled - Showcase Your Skills, Build Your Future"
export const size = {
  width: 1200,
  height: 630,
}

export const contentType = "image/png"

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: "linear-gradient(to bottom right, white, #f3f4f6)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
        }}
      >
        {/* Logo and Brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "24px",
            gap: "12px",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
          <span
            style={{
              fontSize: "48px",
              fontWeight: "bold",
            }}
          >
            0Unveiled
          </span>
        </div>

        {/* Main Title */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: "24px",
            background: "linear-gradient(to right, #000000, #ffffff)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          Showcase Your Skills
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "32px",
            color: "#6B7280",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          Build your future through real-world projects and collaboration
        </div>

        {/* Beta Badge */}
        <div
          style={{
            marginTop: "48px",
            padding: "8px 16px",
            background: "#4F46E5",
            color: "white",
            borderRadius: "9999px",
            fontSize: "24px",
          }}
        >
          Beta Access Now Open
        </div>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    },
  )
}
