import "../styles/globals.css";
import type { AppProps } from "next/app";
import WalletProvider from "../context/WalletContext";
import ThemeProvider from "../context/ThemeContext";
import UserProvider from "../context/UserContext";
import { Provider as ReduxProvider } from "react-redux";
import store from "../lib/store";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider>
        <WalletProvider>
          <UserProvider>
            <Component {...pageProps} />
          </UserProvider>
        </WalletProvider>
      </ThemeProvider>
    </ReduxProvider>
  );
}
