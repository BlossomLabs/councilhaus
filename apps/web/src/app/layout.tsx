import "@repo/ui/globals.css";
import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { SITE_DESCRIPTION, SITE_NAME } from "../constants";
import { WalletProvider } from "../context/WalletProvider";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: SITE_DESCRIPTION,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={newsreader.className}>
        <WalletProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow px-4 container max-w-3xl mx-auto">
              {children}
            </main>
            <Footer />
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
