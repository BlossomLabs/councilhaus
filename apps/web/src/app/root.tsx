import type { MetaFunction } from "@remix-run/node";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";

import { ToastProvider } from "@repo/ui/components/ui/toast";
import { Toaster } from "@repo/ui/components/ui/toaster";
import { TooltipProvider } from "@repo/ui/components/ui/tooltip";
import { Layout } from "../components/Layout";
import { WalletProvider } from "../context/WalletProvider";

import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_TWITTER,
} from "../../../../constants";

import rainbowStyles from "@rainbow-me/rainbowkit/styles.css?url";
import styles from "@repo/ui/globals.css?url";

export function links() {
  return [
    {
      rel: "icon",
      href: "/logo-dark.svg",
      type: "image/svg+xml",
    },
    { rel: "shortcut icon", href: "/favicon.ico" },
    {
      rel: "apple-touch-icon",
      sizes: "180x180",
      href: "/apple-touch-icon.png",
    },
    { rel: "manifest", href: "/manifest.json" },
    { rel: "stylesheet", href: styles },
    { rel: "stylesheet", href: rainbowStyles },
  ];
}

export const meta: MetaFunction = () => [
  {
    charset: "utf-8",
    title: SITE_NAME,
    viewport: "width=device-width,initial-scale=1",
  },
  { name: "description", content: SITE_DESCRIPTION },
  { name: "theme-color", content: "#111827" },
  { name: "color-scheme", content: "dark" },

  { name: "image", content: `${SITE_URL}/logo-bg.svg` },
  { name: "og:image", content: `${SITE_URL}/opengraph-image.webp` },
  { name: "og:title", content: SITE_NAME },
  { name: "og:description", content: SITE_DESCRIPTION },
  { name: "og:url", content: SITE_URL },
  { name: "og:type", content: "website" },
  { name: "og:site_name", content: SITE_NAME },
  { name: "og:locale", content: "en_US" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: `${SITE_URL}/opengraph-image.webp` },
  { name: "twitter:title", content: SITE_NAME },
  { name: "twitter:description", content: SITE_DESCRIPTION },
  { name: "twitter:site", content: SOCIAL_TWITTER },
  { name: "twitter:creator", content: SOCIAL_TWITTER },
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <WalletProvider>
          <ToastProvider>
            <TooltipProvider>
              <Layout>
                <Outlet />
              </Layout>
            </TooltipProvider>
            <Toaster />
          </ToastProvider>
        </WalletProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
