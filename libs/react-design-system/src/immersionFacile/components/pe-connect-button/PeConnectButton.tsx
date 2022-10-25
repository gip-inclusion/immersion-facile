import React from "react";
import "./PeConnectButton.css";

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
      title="Connexion avec PE Connect"
    >
      Connexion avec PE Connect
    </a>
  </div>
);
