import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

/**
 * "/" is always English and "/th" always Thai, so neither page changes
 * language after it is painted. This sends a visitor whose saved setting (or,
 * on a first visit, whose browser) is Thai from "/" to "/th" up front.
 */
const TO_THAI = `(function(){try{if(location.pathname!=="/")return;var s=localStorage.getItem("qedify:v2");var th=s?/"lang":"th"/.test(s):/^th\\b/i.test(navigator.language||"");if(th)location.replace("/th"+location.search)}catch(e){}})();`;

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
        {/* Thai visitors opening "/" go to the Thai landing page before anything is painted. */}
        <script dangerouslySetInnerHTML={{ __html: TO_THAI }} />
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
