import React from "react";
import { useStyles } from "tss-react/dsfr";
import "./InclusionConnectButton.scss";

export interface InclusionConnectButtonProps {
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  inclusionConnectEndpoint: string;
  layout?: "default" | "2-lines";
  id?: string;
}

export const InclusionConnectButton = ({
  onClick,
  inclusionConnectEndpoint,
  layout = "default",
  id = "inclusion-connect-button",
}: InclusionConnectButtonProps) => {
  const { cx } = useStyles();
  return (
    // biome-ignore lint/a11y/useValidAnchor:
    <a
      onClick={onClick}
      href={`/api${inclusionConnectEndpoint}`}
      id={id}
      className={cx(
        "inclusion-connect-button",
        `inclusion-connect-button--${layout}`,
      )}
    >
      <span className={cx("inclusion-connect-button__label")}>
        Se connecter avec{" "}
        <strong className={cx("inclusion-connect-button__ic-label")}>
          Inclusion Connect
        </strong>
      </span>
    </a>
  );
};
