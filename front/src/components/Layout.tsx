import React, { ReactNode } from "react";
import { Footer } from "src/components/Footer";
import { MarianneHeader } from "src/components/MarianneHeader";

type LayoutProps = {
  children: ReactNode;
};

export const Layout = ({ children }: LayoutProps) => (
  <>
    <MarianneHeader />
    {children}
    <Footer />
  </>
);
