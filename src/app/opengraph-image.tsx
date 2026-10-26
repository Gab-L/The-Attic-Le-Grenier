import { ImageResponse } from "next/og";
export const alt = "Le Grenier — Les souvenirs se collectionnent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#f5edda",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "#574633",
        padding: 70,
      }}
    >
      <div style={{ fontSize: 30, letterSpacing: 7, marginBottom: 35 }}>
        LES SOUVENIRS SE COLLECTIONNENT
      </div>
      <div style={{ fontSize: 110, fontWeight: 700 }}>le grenier.</div>
      <div style={{ fontSize: 36, color: "#aa5735", marginTop: 35 }}>
        Un carton. Trois petits bonheurs.
      </div>
    </div>,
    size,
  );
}
