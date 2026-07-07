import type { MetadataRoute } from "next";
import { SEO } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SEO.name} — Software Engineer`,
    short_name: "ahmadexe",
    description: SEO.description,
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    categories: ["portfolio", "technology", "developer"],
    icons: [
      {
        src: "/icon",
        sizes: "64x64",
        type: "image/png",
      },
    ],
  };
}
