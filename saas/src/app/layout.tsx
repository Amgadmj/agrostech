import type { Metadata } from "next";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

export const metadata: Metadata = {
  title: "AgrosTech — Inteligência Geoespacial & Gêmeos Digitais Rurais",
  description: "Plataforma B2B/B2C para inteligência territorial, compliance fundiário (SICAR/SIGEF/IBAMA) e gêmeos digitais 3D com orquestração autônoma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-background text-[#d1d1e0] antialiased selection:bg-brand-neon selection:text-black min-h-screen">
        {children}
      </body>
    </html>
  );
}
