import React from "react";
import "./PageHeader.scss";

type PageHeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
  usePatterns?: boolean;
};

const componentName = "im-page-header";

export const PageHeader = ({
  title,
  className,
  children,
  usePatterns,
}: PageHeaderProps) => (
  <section className={`${componentName} ${className ?? ""} fr-py-6w`}>
    <div className={`${componentName}__inner fr-container`}>
      <h1 className={`${componentName}__title`}>{title}</h1>
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
