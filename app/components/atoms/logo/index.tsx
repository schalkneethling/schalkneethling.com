import { LinksFunction } from "remix";

import styles from "~/styles/atoms/logo/index.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: styles }];
};

export default function Logo() {
  return (
    <h1 className="logo">
      <span className="visually-hidden">The blog of Schalk Neethling</span>
    </h1>
  );
}
