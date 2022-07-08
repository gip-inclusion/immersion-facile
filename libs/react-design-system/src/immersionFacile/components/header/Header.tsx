import React from "react";

export type ImmersionPureHeaderProps = {
  isAdminConnected: boolean;
  marianneLogo: React.ReactNode;
  immersionLogo: React.ReactNode;
  tooltipAdmin: React.ReactNode;
};

export const Header = ({
  isAdminConnected,
  tooltipAdmin,
  marianneLogo,
  immersionLogo,
}: ImmersionPureHeaderProps) => (
  <section
    className="flex justify-between px-3 "
    style={{ boxShadow: "0 4px 2px -2px silver" }}
  >
    <div>
      {marianneLogo}
      <div className="pb-1 text-xs font-light">
        Faciliter la réalisation des immersions professionnelles
      </div>
    </div>

    <div className="flex items-center">
      <div
        className="flex flex-wrap justify-center"
        style={{ minWidth: "100px" }}
      >
        {immersionLogo}
      </div>
      {isAdminConnected && tooltipAdmin}
    </div>
  </section>
);
