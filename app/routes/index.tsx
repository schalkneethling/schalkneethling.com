import { LinksFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

import { Logo, links as LogoStyles } from "~/components/atoms/logo";
import styles from "~/styles/index.css";

export const links: LinksFunction = () => [
  ...LogoStyles(),
  { rel: "stylesheet", href: styles },
];

export default function Index() {
  return (
    <div className="homepage-container">
      <Logo />
      <Link to="/pages/about">About Me</Link>
      <Link to="/posts">My Writing</Link>
    </div>
  );
}
