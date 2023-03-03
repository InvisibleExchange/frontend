import React, { useState, useContext, useEffect } from "react";
import { WalletContext } from "../../../context/WalletContext";
import Book from "./Book/Book";
import Trades from "./Trades/Trades";

export type TradeType = {
  size: number;
  side: "buy" | "sell";
  price: number;
  time: number;
};

export default function BookTrades() {
  const { network } = useContext(WalletContext);

  const [tab, setTab] = useState<"Book" | "Trades">("Book");

  const [ws, setWs] = useState<WebSocket>();
  const [trades, setTrades] = useState<TradeType[]>([]);

  let element;
  switch (tab) {
    case "Book":
      element = <Book />;
      break;
    case "Trades":
      element = <Trades trades={trades} />;
      break;
    default:
      break;
  }

  return (
    <div className="w-full h-[70vh]">
      <Book />
      <Trades trades={trades} />
    </div>
  );
}
