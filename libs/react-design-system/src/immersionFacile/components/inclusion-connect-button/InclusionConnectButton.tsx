import "./InclusionConnectButton.css";
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
    className="btn-inclusion-connect"
    target="_blank"
  >
    <img
      src="./logo-inclusion-connect-two-lines.svg"
      height="37"
      alt="Se connecter avec Inclusion Connect"
    />
  </a>
);
