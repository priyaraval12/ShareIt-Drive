import { AppProps } from "next/app";
import Head from "next/head";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import { ApolloClient, ApolloProvider, InMemoryCache } from "@apollo/client";
import { config } from "../config";


const App = (props: AppProps) => {
  const { Component, pageProps } = props;
  const apolloClient = new ApolloClient({
    uri: config.metadriveFileSubgraphAddress,
    cache: new InMemoryCache(),
  });

  return (
    <>
      <Head>
        <title>ShareIt</title>
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width"
        />
      </Head>

      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: "light",
        }}
      >
        <ModalsProvider>
          <ApolloProvider client={apolloClient}>
            <Component {...pageProps} />
          </ApolloProvider>
        </ModalsProvider>
      </MantineProvider>
    </>
  );
};

export default App;
