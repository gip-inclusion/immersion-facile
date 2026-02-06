import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./SearchResultIllustration.styles";

type SearchResultIllustrationProps = {
  children: ReactNode;
  illustration: string;
  isFaded: boolean;
};

export const SearchResultIllustration = ({
  children,
  illustration,
  isFaded,
}: SearchResultIllustrationProps) => {
  const { cx } = useStyles();
  return (
    <div
      className={cx(Styles.root, isFaded ? Styles.isFaded : null)}
      style={{
        backgroundImage: `url(${illustration})`,
      }}
    >
      {children}
    </div>
  );
};
