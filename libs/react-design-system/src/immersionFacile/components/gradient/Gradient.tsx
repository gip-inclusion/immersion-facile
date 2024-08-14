import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./Gradient.styles";

type GradientProps = {
  children: React.ReactNode;
};

export const Gradient = ({ children }: GradientProps) => {
  const { cx } = useStyles();
  return (
    <div
      className={cx(Styles.root)}
      style={{
        backgroundImage: `linear-gradient(${Math.floor(
          Math.random() * 360,
        )}deg, var(--grey-1000-100) 0%, rgba(182,229,238,1) 100%)`,
      }}
    >
      {children}
    </div>
  );
};
