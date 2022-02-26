import { LinksFunction } from "remix";

import styles from "./styles.css";

type Card = {
  children: React.ReactNode;
  type: string;
};

export const links: LinksFunction = () => [{ rel: "stylesheet", href: styles }];

export function Card({ children, type }: Card) {
  if (type === "listItem") {
    return <li className="card">{children}</li>;
  }

  return <div className="card">{children}</div>;
}
