import React from "react";
import "./PageHeader.scss";

type PageHeaderProps = {
  title: string;
  className?: string;
  children?: React.ReactNode;
};

const componentName = "im-page-header";

export const PageHeader = ({ title, className, children }: PageHeaderProps) => (
  <section className={`${componentName} ${className ?? ""} fr-py-6w`}>
    <div className="fr-container">
      <h1 className={`${componentName}__title`}>{title}</h1>
      {children}
    </div>
  </section>
);
