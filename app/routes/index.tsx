import { Link, LinksFunction } from "remix";

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
      <Link to="/posts">Posts</Link>
    </div>
  );
}
