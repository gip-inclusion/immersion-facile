import React, { ReactNode } from "react";

type HomeButtonTypes = "primary" | "secondary" | "error";

export type HomeButtonProps = {
  disable?: boolean;
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  type?: HomeButtonTypes;
  width?: "w-full" | null;
};

export const buttonClassnames: Record<HomeButtonTypes, string> = {
  primary: "bg-immersionBlue text-white shadow-none mt-1 mb-2",
  secondary: "bg-white text-immersionBlue border-2 border-blue-200",
  error: "bg-immersionRed text-white shadow-none mt-1 mb-2",
};

export const ButtonHome = ({
  onClick,
  disable,
  children,
  className,
  type = "primary",
  width = "w-full",
}: HomeButtonProps) => (
  <button
    className={
      className
        ? className
        : `rounded-md${width ? ` ${width} ` : " "}h-15 py-3 px-2 no-underline ${
            buttonClassnames[type]
          } font-semibold text-center text-sm`
    }
    style={type === "secondary" ? { border: "2px solid" } : {}}
    onClick={onClick}
    disabled={disable}
  >
    {children}
  </button>
);
