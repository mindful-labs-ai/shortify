import shoriPng from "@/assets/shori.png";

interface ShoriProps {
  pose?: "wave" | "idle" | "reach" | "munch";
  size?: number;
}

export default function Shori({ pose = "wave", size = 220 }: ShoriProps) {
  const tilt =
    pose === "reach" ? -4 : pose === "munch" ? 3 : pose === "idle" ? 0 : -2;
  const lift = pose === "reach" ? -8 : pose === "wave" ? -2 : 0;

  return (
    <div
      aria-label="Shori — shortify mascot"
      style={{
        position: "relative",
        width: size,
        height: size,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          bottom: size * 0.04,
          transform: "translateX(-50%)",
          width: size * 0.62,
          height: size * 0.06,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse at center, rgba(26,22,20,0.22) 0%, rgba(26,22,20,0) 70%)",
          pointerEvents: "none",
        }}
      />
      <img
        src={shoriPng}
        alt="Shori"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          display: "block",
          transform: `rotate(${tilt}deg) translateY(${lift}px)`,
          transformOrigin: "50% 80%",
          transition: "transform 220ms cubic-bezier(0.2,0,0,1)",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
