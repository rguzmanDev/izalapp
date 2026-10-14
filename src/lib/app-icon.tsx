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
          background: "#171717",
          color: "#ffffff",
          fontSize: size * 0.6,
          fontWeight: 700,
        }}
      >
        I
      </div>
    ),
    { width: size, height: size },
  );
}
