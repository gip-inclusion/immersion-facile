import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SearchResultIllustration.styles";

type SearchResultIllustrationProps = {
  children: ReactNode;
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
      }}
    >
      {children}
    </div>
  );
};
