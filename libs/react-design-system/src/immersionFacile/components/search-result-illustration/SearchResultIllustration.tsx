import React from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SearchResultIllustration.styles";

type SearchResultIllustrationProps = {
  children: React.ReactNode;
  illustration: string;
};

export const SearchResultIllustration = ({
  children,
  illustration,
}: SearchResultIllustrationProps) => {
  const { cx } = useStyles();
  return (
    <div
      className={cx(Styles.root)}
      style={{
        backgroundImage: `url(${illustration})`,
        backgroundColor: "var(--blue-france-950-100)",
        backgroundPosition: "center center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    >
      {children}
    </div>
  );
};
