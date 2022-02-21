import { LinksFunction } from "remix";

import styles from "./styles.css";

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export function Logo() {
  return (
    <h1 className="logo">
      <span className="visually-hidden">The blog of Schalk Neethling</span>
    </h1>
  );
}
