import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SEO, SITE_URL } from "@/lib/seo";
import { identity } from "@/lib/data";

const jet = JetBrains_Mono({
  variable: "--font-jet",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
});

const space = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: SEO.title,
    template: SEO.titleTemplate,
  },

  description: SEO.description,
  keywords: SEO.keywords,

  authors: [{ name: SEO.name, url: SITE_URL }],
  creator: SEO.name,
  publisher: SEO.name,

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "profile",
    locale: "en_US",
    url: SITE_URL,
    siteName: `${SEO.handle} · ${SEO.name}`,
    title: SEO.title,
    description: SEO.description,
    images: [
      {
        url: SEO.ogImage,
        width: 1200,
        height: 630,
        alt: `${SEO.name} – Software Engineer`,
      },
    ],
    firstName: "Muhammad",
    lastName: "Ahmad",
    username: SEO.handle,
  },

  twitter: {
    card: "summary_large_image",
    title: SEO.title,
    description: SEO.description,
    creator: SEO.twitterHandle,
    images: [SEO.ogImage],
  },

  category: "technology",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: identity.fullName,
      alternateName: identity.handle,
      url: SITE_URL,
      jobTitle: identity.role,
      description: identity.bio,
      image: {
        "@type": "ImageObject",
        url: SEO.ogImage,
        width: 1200,
        height: 630,
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Islamabad",
        addressCountry: "PK",
      },
      sameAs: [
        identity.socials.github,
        identity.socials.medium,
        identity.socials.linkedin,
      ],
      knowsAbout: [
        "Go",
        "Golang",
        "Kafka",
        "Redis",
        "MongoDB",
        "PostgreSQL",
        "Microservices",
        "Distributed Systems",
        "gRPC",
        "REST APIs",
        "Flutter",
        "Dart",
        "Mobile Development",
        "Blockchain",
        "AI Agents",
        "Multi-Agent Systems",
        "LLM Orchestration",
        "Software Architecture",
        "System Design",
        "Open Source Software",
      ],
      hasCredential: [
        {
          "@type": "EducationalOccupationalCredential",
          name: "1st Prize, ICT Innovation Global Finals",
          description: "Awarded at the 2025 ICT Innovation Global Finals in Shenzhen, China for PRISM and Agenix.",
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: `${identity.handle} · ${identity.fullName}`,
      description: SEO.description,
      author: { "@id": `${SITE_URL}/#person` },
      inLanguage: "en-US",
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "ProfilePage",
      "@id": `${SITE_URL}/#profilepage`,
      url: SITE_URL,
      name: SEO.title,
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: { "@id": `${SITE_URL}/#person` },
      description: SEO.description,
      inLanguage: "en-US",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${jet.variable} ${space.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
      </head>
      <body
        className="min-h-screen bg-bg text-ink font-mono selection:bg-matrix selection:text-black"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
