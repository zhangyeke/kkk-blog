import type { Metadata } from "next"

type PublicPageMetadataInput = {
  title: string
  description: string
  path: string
  image?: string
}

export function createPublicPageMetadata({ title, description, path, image }: PublicPageMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title,
      description,
      url: path,
      ...(image ? { images: [{ url: image, alt: title }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
