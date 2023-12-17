import { ReactNode, useContext } from "react";
import ConnectWallet from "./Navbar/ConnectWallet";
import LanguageSelector from "./Navbar/LanguageSelector";
import { ThemeContext, themes } from "../../context/ThemeContext";

import Logo from "./Logo/Logo";
import Nav from "./Navbar/Nav";
import ThemeSelector from "./Navbar/ThemeSelector";
import classNames from "classnames";

interface Props {
  children: ReactNode;
}

export default function Layout({ children }: Props) {
  const { theme } = useContext(ThemeContext);

  return (
    <>
      <header className="flex justify-between py-3 border-b w-100 border-b-border_color">
        <div className="flex pl-3">
          <Logo />
          <Nav />
        </div>
        <div className="flex">
          {/* <ThemeSelector />
          <LanguageSelector /> */}
          <ConnectWallet />
        </div>
      </header>
      <main className={classNames("flex", theme === "dark" && "dark")}>
        {children}
      </main>
      {/* <footer className="flex items-center justify-between h-8 p-2 border-t w-100 border-t-border_color text-gray_dark">
        <Socials />
      </footer> */}
    </>
  );
}
