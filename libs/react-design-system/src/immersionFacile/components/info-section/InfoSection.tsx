import type { ReactNode } from "react";
import { useStyles } from "tss-react/dsfr";
import Styles from "./InfoSection.styles";

export type InfoSectionProps = {
  description: ReactNode;
  className?: string;
};

export const InfoSection = ({ description, className }: InfoSectionProps) => {
  const { cx } = useStyles();
  return (
    <section className={cx(Styles.root, className)}>{description}</section>
  );
};
