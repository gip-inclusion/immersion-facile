import React from "react";
import { loginPeConnect } from "shared/src/routes";

export const PeConnectButton = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) => (
  <div className="pe-connect flex justify-center">
    <a
      onClick={onClick}
      href={`/api/${loginPeConnect}`}
      className="button-pe-connect"
      title=""
    >
      <img
        className="icon-pe-connect"
        src="/pe-connect-barre-nav-b.svg"
        alt=""
        width="300"
        height="75"
      />
      <img
        className="icon-pe-connect-hover"
        src="/pe-connect-barre-nav-b-o.svg"
        alt=""
        width="300"
        height="75"
      />
    </a>
  </div>
);
