import React, { ReactNode } from "react";

type ConventionFormContainerLayoutProps = {
  children: ReactNode;
};

export const ConventionFormContainerLayout = ({
  children,
}: ConventionFormContainerLayoutProps) => (
  <>
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <div className="fr-col-lg-8 fr-p-2w">{children}</div>
    </div>
  </>
);
