import type { Metadata, Viewport } from "next";

export const viewport: Viewport = {
  themeColor: "#0D9488",
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://eraiiz.com'),
  title: "Eraiiz - Shop Sustainable, Live Responsible",
  description:
    "Eraiiz is the ultimate global platform for eco-friendly shopping. Discover ethically-made products that promote sustainable living. Join the Eraiiz movement to make a positive impact on the planet, one responsible purchase at a time.",
  keywords: [
    "Eraiiz",
    "Sustainable Shopping",
    "Eco-Friendly Products",
    "Ethical Marketplace",
    "Sustainability Platform",
    "Green Products",
    "Eco-Conscious Shopping",
    "Global Sustainability",
    "Sustainable Living",
    "Zero Waste",
    "Fair Trade Products",
    "Green Living",
    "Climate Conscious Shopping",
    "Sustainable Lifestyle",
  ],
  openGraph: {
    title: "Eraiiz - Shop Sustainable, Live Responsible",
    description:
      "Join Eraiiz, the global platform for eco-conscious shopping. Discover sustainable, ethically-made products designed to protect our planet. Shop responsibly and create a greener future.",
    url: "https://www.eraiiz.com",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Eraiiz - Global Sustainable Shopping Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Eraiiz - Shop Sustainable, Live Responsible",
    description:
      "Discover eco-friendly, ethically-made products from around the world. Eraiiz is your destination for sustainable shopping.",
    images: ["/images/eraiiz-banner.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
}; 