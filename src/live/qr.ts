import QRCode from "qrcode";

export async function qrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, {
    margin: 1,
    width: 240,
    color: { dark: "#080b12", light: "#ffffff" }
  });
}
