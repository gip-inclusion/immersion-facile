import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import Styles from "./PageHeader.styles";

type PageHeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
  usePatterns?: boolean;
  centered?: boolean;
  theme?: "default" | "candidate" | "establishment" | "agency";
  classes?: Partial<Record<"root" | "inner" | "title", string>>;
};

export const PageHeader = ({
  title,
  className,
  children,
  usePatterns,
  centered,
  theme = "default",
  classes = {},
}: PageHeaderProps) => {
  const { cx } = useStyles();
  return (
    <section
      className={cx(
        fr.cx("fr-py-7w"),
        Styles.root,
        Styles[theme],
        ` ${className ?? ""}`,
        classes.root,
      )}
    >
      <div className={cx(fr.cx("fr-container"), Styles.inner, classes.inner)}>
        <h1
          className={cx(
            Styles.title,
            centered && Styles.titleCentered,
            children ? "" : "fr-my-auto",
            classes.title,
          )}
        >
          {title}
        </h1>
        {children}
        {usePatterns && (
          <div className={cx(Styles.patterns)}>
            <div className={cx(Styles.pattern, Styles.pattern0)}></div>
            <div className={cx(Styles.pattern, Styles.pattern1)}></div>
            <div className={cx(Styles.pattern, Styles.pattern2)}></div>
          </div>
        )}
      </div>
    </section>
  );
};
