import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EarthPulse",
  description:
    "A 3D interactive globe visualizing live environmental and disaster data",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
