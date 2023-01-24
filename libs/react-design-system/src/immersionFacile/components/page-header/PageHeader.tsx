import React from "react";
import "./PageHeader.scss";

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
}: PageHeaderProps) => (
  <section
    className={`${componentName} ${componentName}--${theme} ${
      className ?? ""
    } fr-py-7w`}
  >
    <div className={`${componentName}__inner fr-container`}>
      <h1
        className={`${componentName}__title ${
          centered ? `${componentName}__title--centered` : ""
        } ${children ? "" : "fr-my-auto"}`}
      >
        {title}
      </h1>
      {children}
      {usePatterns && (
        <div className="im-page-header__patterns">
          <div className="im-page-header__pattern im-hero-header__pattern--0"></div>
          <div className="im-page-header__pattern im-hero-header__pattern--1"></div>
          <div className="im-page-header__pattern im-hero-header__pattern--2"></div>
        </div>
      )}
    </div>
  </section>
);
