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
          background: "#1a5a66",
          color: "#f4fafb",
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
