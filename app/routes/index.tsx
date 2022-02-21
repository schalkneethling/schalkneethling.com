import { Link } from "remix";

import Logo from "../components/atoms/logo";

export default function Index() {
  return (
    <>
      <Logo />
      <Link to="/posts">Posts</Link>
    </>
  );
}
