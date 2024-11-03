import type { PropsWithChildren } from "react";
import Footer from "./Footer";
import Header from "./Header";

export function Layout(props: PropsWithChildren) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container max-w-4xl mx-auto pt-10 bg-[url('/bg.svg')] bg-contain bg-no-repeat">
        {props.children}
      </main>
      <Footer />
    </div>
  );
}
