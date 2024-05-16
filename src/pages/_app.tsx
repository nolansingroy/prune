import "../app/globals.css"; // Adjust the import path as needed
import Layout from "../app/layout"; // Adjust the import path as needed

import Header from "@/components/header";
import Footer from "@/components/footer";

function MyApp({ Component, pageProps }: { Component: any; pageProps: any }) {
  return (
    <>
      <Header />
      <main>
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
}

export default MyApp;
