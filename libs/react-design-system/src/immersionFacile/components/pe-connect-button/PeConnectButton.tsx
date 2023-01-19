import React from "react";
import "./PeConnectButton.scss";

export type PeConnectButtonProps = {
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  peConnectEndpoint: string;
};

export const PeConnectButton = ({
  onClick,
  peConnectEndpoint,
}: PeConnectButtonProps) => (
  <div className="pe-connect">
    <a
      onClick={onClick}
      href={`/api/${peConnectEndpoint}`}
      className="pe-connect__button"
      title="Se connecter avec Pôle emploi"
    >
      Se connecter avec Pôle emploi
    </a>
  </div>
);
