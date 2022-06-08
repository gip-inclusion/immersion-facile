import React from "react";

interface LinkProps {
  children: React.ReactNode;
  href: string;
  onClick: () => void;
}

export const LinkWithButtonStyle = ({ children, ...props }: LinkProps) => (
  <a
    className="no-underline shadow-none bg-immersionRed py-3 px-2 mt-1 mb-2 rounded-md text-white font-semibold  w-full text-center h-15 text-sm"
    {...props}
  >
    {children}
  </a>
);
