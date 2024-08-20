import React from "react";
import { useStyles } from "tss-react/dsfr";
import illustration from "../../../../public/assets/images/illustration-search-test.png";
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
        backgroundImage: `url(${illustration}), linear-gradient(${Math.floor(
          Math.random() * 360,
        )}deg, var(--grey-1000-100) 0%, rgba(182,229,238,1) 100%)`,
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {children}
    </div>
  );
};
