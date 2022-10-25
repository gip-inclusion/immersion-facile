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
      {/* <img
        className="icon-pe-connect"
        src="/img/pe-connect-barre-nav-b.svg"
        alt=""
        width="300"
        height="75"
      />
      <img
        className="icon-pe-connect-hover"
        src="/img/pe-connect-barre-nav-b-o.svg"
        alt=""
        width="300"
        height="75"
      /> */}
      Connexion avec PE Connect
    </a>
  </div>
);
