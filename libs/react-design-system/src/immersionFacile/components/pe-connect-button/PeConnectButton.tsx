import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

import "./PeConnectButton.scss";

export type PeConnectButtonProps = {
  onClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  peConnectEndpoint: string;
};

export const PeConnectButton = ({
  onClick,
  peConnectEndpoint,
}: PeConnectButtonProps) => {
  const { cx } = useStyles();
  return (
    <div className={cx(fr.cx("fr-my-2w"), "pe-connect")}>
      <a
        onClick={onClick}
        href={`/api/${peConnectEndpoint}`}
        className={cx("pe-connect__button")}
        title="Se connecter avec Pôle emploi"
      >
        Se connecter avec Pôle emploi
      </a>
    </div>
  );
};
