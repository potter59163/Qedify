import Head from "expo-router/head";
import React from "react";

export const SITE = {
  name: "QEDify",
  /** Public origin, used for canonical links and social cards. */
  url: (process.env.EXPO_PUBLIC_SITE_URL ?? "https://qedify.vercel.app").replace(/\/$/, ""),
  tagline: "Learn momentum through space rescue missions",
  description:
    "QEDify is a free physics game for high-school students. Master momentum, impulse and collisions by solving space rescue missions with instant feedback, adaptive difficulty and an AI coach.",
};

/**
 * Document head for one page: title, description, canonical URL and social
 * cards. Screens that need a signed-in cadet pass `index={false}` so search
 * engines skip them.
 */
export function Seo({
  title,
  description = SITE.description,
  path = "/",
  index = true,
  jsonLd,
}: {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
  jsonLd?: Record<string, unknown>;
}) {
  const fullTitle = title ? `${title} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;
  const url = SITE.url + path;
  const image = `${SITE.url}/og-image.jpg`;
  return (
    <Head>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {index ? <link rel="canonical" href={url} /> : <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:locale" content="en_US" />
      <meta property="og:locale:alternate" content="th_TH" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="QEDify: a planet with a rocket and the words Learn momentum through space rescue missions" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      {jsonLd ? <script type="application/ld+json">{JSON.stringify(jsonLd)}</script> : null}
    </Head>
  );
}
