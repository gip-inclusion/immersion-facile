import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import "./PeConnectButton.scss";
import type { MouseEvent } from "react";

export type PeConnectButtonProps = {
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
  peConnectEndpoint: string;
};

export const PeConnectButton = ({
  onClick,
  peConnectEndpoint,
}: PeConnectButtonProps) => {
  const { cx } = useStyles();
  return (
    <div className={cx(fr.cx("fr-my-2w"), "pe-connect")}>
      {/* biome-ignore lint/a11y/useValidAnchor:  */}
      <a
        onClick={onClick}
        href={`/api/${peConnectEndpoint}`}
        className={cx("pe-connect__button")}
        title="Se connecter avec France Travail (anciennement Pôle emploi)"
      >
        Se connecter avec France Travail (anciennement Pôle emploi)
      </a>
    </div>
  );
};
