import Link from "next/link";
import { useRouter } from "next/router";
import React from "react";

export default function Nav() {
  const router = useRouter();

  return (
    <div className="flex gap-4 ml-5">
      <Link
        href="/trade"
        className={`flex items-center text-fg_below_color text-sm font-medium tracking-wider ${
          router.route.includes("trade") ? `text-fg_top_color` : undefined
        }`}
      >
        Exchange
      </Link>

      <Link
        href="/transact"
        className={`flex ml-5 items-center text-fg_below_color text-sm font-medium tracking-wider ${
          router.route.includes("transact") ? `text-fg_top_color` : undefined
        }`}
      >
        Deposit / Withdraw
      </Link>

      {/* <Link
        href="/contact"
        className={`flex ml-5 items-center text-fg_below_color text-sm font-medium tracking-wider ${
          router.route.includes("contact") ? `text-fg_top_color` : undefined
        }`}
      >
        Contact Us
      </Link> */}
    </div>
  );
}
