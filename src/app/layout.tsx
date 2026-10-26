import type { Metadata } from "next";
import { siteOrigin } from "@/lib/site-url";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";
import "@fontsource/dm-sans/700.css";
import "@fontsource/fraunces/400.css";
import "@fontsource/fraunces/500.css";
import "@fontsource/fraunces/600.css";
import "@fontsource/fraunces/400-italic.css";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: "Le Grenier — Les souvenirs se collectionnent",
  description:
    "Ouvre un carton de ton enfance, retrouve tes petits trésors et reconstruis la chambre de tes rêves.",
  openGraph: {
    title: "Le Grenier",
    description:
      "Les souvenirs se collectionnent. Une chambre à inventer, un carton à ouvrir.",
    locale: "fr_FR",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
