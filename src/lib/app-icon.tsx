import { ImageResponse } from "next/og";

export function renderAppIcon(size: number) {
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
          color: "#f2f6ef",
          fontSize: size * 0.58,
          fontWeight: 700,
          letterSpacing: "-0.04em",
        }}
      >
        I
      </div>
    ),
    { width: size, height: size },
  );
}
