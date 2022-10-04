import React, { ReactNode } from "react";

type HomeButtonTypes =
  | "candidate"
  | "establishment"
  | "candidate-secondary"
  | "establishment-secondary"
  | "error";

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
  candidate: "bg-immersionRed text-white shadow-none mt-1 mb-2",
  "candidate-secondary": "bg-white text-immersionRed border-2 border-blue-200",
  establishment: "bg-immersionBlue text-white shadow-none mt-1 mb-2",
  "establishment-secondary":
    "bg-white text-immersionBlue border-2 border-blue-200",
  error: "bg-immersionRed text-white shadow-none mt-1 mb-2",
};

export const ButtonHome = ({
  onClick,
  disable,
  children,
  className,
  type = "establishment",
  width = "w-full",
}: HomeButtonProps) => (
  <button
    className={
      className
        ? className
        : `fr-btn ${width ? ` ${width} ` : " "}h-15 fr-btn--${type}`
    }
    onClick={onClick}
    disabled={disable}
    type="button"
  >
    {children}
  </button>
);
