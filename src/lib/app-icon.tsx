import { ImageResponse } from "next/og";

export function renderAppIcon(size: number) {
  const s = size;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2f5c3a",
        }}
      >
        <svg width={s * 0.62} height={s * 0.62} viewBox="0 0 32 32" fill="none">
          <path d="M16 4.5 L26.5 26.5 H5.5 Z" fill="rgba(242,246,239,0.2)" stroke="#f2f6ef" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M16 4.5 L20.5 15 H11.5 Z" fill="rgba(242,246,239,0.45)" />
          <circle cx="16" cy="7" r="1.8" fill="#f2f6ef" />
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
