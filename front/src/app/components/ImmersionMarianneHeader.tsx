import immersionFacileLogo from "/Logo-immersion-facilitee-01-RVB-reflets-crop.svg";
import LogoutIcon from "@mui/icons-material/Logout";
import { IconButton, Tooltip } from "@mui/material";
import React from "react";
import { useDispatch } from "react-redux";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { adminSelectors } from "src/core-logic/domain/admin/admin.selectors";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";

export const LinkHome: React.FC<{ className?: string }> = ({
  children,
  className,
}) => (
  <a {...routes.home().link} className={className}>
    {children}
  </a>
);

export const MarianneLogo = () => (
  <LinkHome>
    <div className="fr-header__brand-top">
      <div className="fr-header__logo">
        <p className="fr-logo">
          République
          <br />
          Française
        </p>
      </div>
    </div>
  </LinkHome>
);

export const ImmersionMarianneHeader = () => {
  const dispatch = useDispatch();
  const isAdminConnected = useAppSelector(adminSelectors.isAuthenticated);

  return (
    <section
      className="flex justify-between px-3 "
      style={{ boxShadow: "0 4px 2px -2px silver" }}
    >
      <div>
        <MarianneLogo />
        <div className="pb-1 text-xs font-light">
          Faciliter la réalisation des immersions professionnelles
        </div>
      </div>

      <div className="flex items-center">
        <div
          className="flex flex-wrap justify-center"
          style={{ minWidth: "100px" }}
        >
          <LinkHome className="w-full h-full shadow-none">
            <img src={immersionFacileLogo} alt="Logo Immersion-Facile" />
          </LinkHome>
        </div>
        {isAdminConnected && (
          <Tooltip title="Se déconnecter de l'Admin" placement="top">
            <IconButton
              onClick={() => dispatch(adminSlice.actions.logoutRequested())}
            >
              <LogoutIcon color="primary" />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </section>
  );
};
