import React from "react";
import Head from "next/head";
import Layout from "../../components/Layout/Layout";
import Trade from "../../components/Trade/Trade";
const TradePage = () => {
  return (
    <>
      <Head>
        <title>Invisible Exchange</title>
        <meta
          name="description"
          content="Invisible is a decentralised P2P orderbook exchange that uses ZK-Rollups to guareente user privacy while maintaining optimal security and scalability"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
        <Trade />
      </Layout>
    </>
  );
};

export default TradePage;
