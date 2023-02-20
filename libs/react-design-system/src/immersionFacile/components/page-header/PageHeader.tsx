import React from "react";
import "./PageHeader.scss";
import { useStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";

type PageHeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
  usePatterns?: boolean;
  centered?: boolean;
  theme?: "default" | "candidate" | "establishment" | "agency";
  classes?: Partial<Record<"root" | "inner" | "title", string>>;
};

const componentName = "im-page-header";

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
        componentName,
        `${componentName}--${theme}`,
        ` ${className ?? ""}`,
        classes.root,
      )}
    >
      <div
        className={cx(`${componentName}__inner fr-container`, classes.inner)}
      >
        <h1
          className={cx(
            `${componentName}__title`,
            centered && `${componentName}__title--centered`,
            children ? "" : "fr-my-auto",
            classes.title,
          )}
        >
          {title}
        </h1>
        {children}
        {usePatterns && (
          <div className={cx("im-page-header__patterns")}>
            <div
              className={cx(
                "im-page-header__pattern",
                "im-hero-header__pattern--0",
              )}
            ></div>
            <div
              className={cx(
                "im-page-header__pattern",
                "im-hero-header__pattern--1",
              )}
            ></div>
            <div
              className={cx(
                "im-page-header__pattern",
                "im-hero-header__pattern--2",
              )}
            ></div>
          </div>
        )}
      </div>
    </section>
  );
};
