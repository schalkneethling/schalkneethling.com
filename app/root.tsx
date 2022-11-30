import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction, MetaFunction } from "@remix-run/node";
import {ExternalScripts, ExternalScriptsFunction} from "remix-utils";

import { Banner, links as BannerStyles } from "./components/atoms/banner/";

export const meta: MetaFunction = () => {
  return {
    title: "Scripting on Decaf ~ Schalk Neethling",
    "msapplication-TileColor": "#ffffff",
    "theme-color": "#ffffff",
  };
};

export const links: LinksFunction = () => {
  return [
    {
      rel: "apple-touch-icon",
      sizes: "80x180",
      href: "/apple-touch-icon.png",
    },
    {
      rel: "icon",
      sizes: "32x32",
      type: "image/png",
      href: "/favicon-32x32.png",
    },
    {
      rel: "icon",
      sizes: "16x16",
      type: "image/png",
      href: "/favicon-16x16.png",
    },
    {
      rel: "manifest",
      href: "/site.webmanifest",
    },
    {
      color: "#243247",
      rel: "mask-icon",
      href: "/safari-pinned-tab.svg",
    },
    {
      href: "/lib/reset.css",
      media: "screen",
      rel: "stylesheet",
      type: "text/css",
    },
    {
      href: "/css/global.css",
      media: "screen",
      rel: "stylesheet",
      type: "text/css",
    },
    ...BannerStyles(),
  ];
};

let scripts: ExternalScriptsFunction = () => {
  return [
    {
      async: true,
      defer: true,
      src: "ttps://scripts.simpleanalyticscdn.com/latest.js",
      crossOrigin: "anonymous",
    },
  ];
};

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <Banner />
        <div className="top-accent-border" />
        <Outlet />
        <ScrollRestoration />
        <ExternalScripts />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
      </body>
    </html>
  );
}
