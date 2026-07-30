import { biya } from "../theme";
import { QRCodeSVG } from "qrcode.react";

export function QRCode({ seed = "biya", size = 200 }: { seed?: string; size?: number }) {
  return (
    <QRCodeSVG
      value={seed}
      size={size}
      bgColor="#ffffff"
      fgColor={biya.ink}
      level="Q"
    />
  );
}
