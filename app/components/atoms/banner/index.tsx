import { Link, LinksFunction } from "remix";

import styles from "./styles.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export function Banner() {
  return (
    <aside className="announcement-banner">
      <p>
        Bootstrapping my blog or,{" "}
        <Link to="/pages/bootstrapping">
          "Why does this thing look broken?"
        </Link>
      </p>
    </aside>
  );
}
