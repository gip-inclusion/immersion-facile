import "./InclusionConnectButton.scss";
import React from "react";

export interface InclusionConnectButtonProps {
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  inclusionConnectEndpoint: string;
}

export const InclusionConnectButton = ({
  onClick,
  inclusionConnectEndpoint,
}: InclusionConnectButtonProps) => (
  <a
    onClick={onClick}
    href={`/api/${inclusionConnectEndpoint}`}
    className="inclusion-connect-button"
  >
    Se connecter avec Inclusion Connect
  </a>
);
