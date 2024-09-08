import "@repo/ui/globals.css";
import type { Metadata } from "next";
import { Newsreader } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";

const newsreader = Newsreader({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CouncilHaus",
  description: "Democratically allocate a budget across projects",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body className={newsreader.className}>
        <div className='flex flex-col min-h-screen'>
          <Header />
          <main className='flex-grow px-4 container max-w-3xl mx-auto'>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
