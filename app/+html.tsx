import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * HTML shell for every statically rendered page (web only). Runs in Node at
 * build time, so it must not touch browser or React Native APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#060d1f" />
        <meta name="color-scheme" content="dark" />
        <meta name="application-name" content="QEDify" />
        <meta name="apple-mobile-web-app-title" content="QEDify" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        {/* Paint the space background before any script runs, so there is no white flash. */}
        <style dangerouslySetInnerHTML={{ __html: "html,body{background:#060d1f;color-scheme:dark}body{overflow:hidden}" }} />
      </head>
      <body>
        {children}
        <noscript>QEDify needs JavaScript to run the physics missions.</noscript>
      </body>
    </html>
  );
}
