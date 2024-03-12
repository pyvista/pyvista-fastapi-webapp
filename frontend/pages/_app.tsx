import type { AppProps } from "next/app";
import Head from 'next/head';
import { PT_Mono } from "next/font/google";
import { getBackendUrl } from '../utils/backendUrl';

const pt_mono = PT_Mono({ weight: "400", subsets: ["latin"] });

import "../app/globals.css";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={pt_mono.className}>
      <Head>
        <title>PyVista Demo</title>
        <link rel="icon" type="image/ico" href={`${getBackendUrl()}favicon.png`} />
      </Head>
      <Component {...pageProps} />
    </div>
  );
}

export default MyApp;
