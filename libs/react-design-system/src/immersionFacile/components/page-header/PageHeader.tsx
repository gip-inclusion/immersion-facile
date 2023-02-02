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
};

const componentName = "im-page-header";

export const PageHeader = ({
  title,
  className,
  children,
  usePatterns,
  centered,
  theme = "default",
}: PageHeaderProps) => {
  const { cx } = useStyles();
  return (
    <section
      className={cx(
        fr.cx("fr-py-7w"),
        componentName,
        `${componentName}--${theme}`,
        ` ${className ?? ""}`,
      )}
    >
      <div className={cx(`${componentName}__inner fr-container`)}>
        <h1
          className={`${componentName}__title ${
            centered ? `${componentName}__title--centered` : ""
          } ${children ? "" : "fr-my-auto"}`}
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
