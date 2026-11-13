import { Redirect } from "expo-router";
import { StyleSheet, View } from "react-native";

import { C, MONO } from "@/constants/theme";
import { href } from "@/lib/nav";
import { SITE, Seo } from "@/lib/seo";
import { useGame } from "@/lib/store";
import { Text } from "@/lib/text";
import { Screen } from "@/lib/ui";

/**
 * Entry point. Like a native app, QEDify has no marketing page: opening it
 * shows the name for a moment while the saved profile loads, then goes
 * straight to the intro (first visit), the profile form, or mission control.
 *
 * The page still carries the site's title, description and social card, so a
 * shared link to the site gets a proper preview.
 */
export default function Index() {
  const { state, ready } = useGame();

  const seo = (
    <Seo
      path="/"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: SITE.name,
        url: SITE.url,
        description: SITE.description,
        applicationCategory: "EducationalApplication",
        operatingSystem: "Any",
        inLanguage: ["en", "th"],
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        audience: { "@type": "EducationalAudience", educationalRole: "student" },
        teaches: ["Momentum", "Impulse", "Conservation of momentum", "Elastic and inelastic collisions"],
      }}
    />
  );

  if (ready) {
    return (
      <>
        {seo}
        <Redirect href={href(state.profile ? "/home" : state.onboarded ? "/register" : "/onboarding")} />
      </>
    );
  }

  return (
    <Screen>
      {seo}
      <View role="main" style={s.splash}>
        {/* The name only: the language is not known until the saved settings load. */}
        <Text style={s.brand} role="heading" aria-level={1}>
          QEDify
        </Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  splash: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  brand: { fontFamily: MONO, fontSize: 34, fontWeight: "bold", color: C.cyanBright, letterSpacing: 8 },
});
