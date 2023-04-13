import React from "react";
import { useStyles } from "tss-react/dsfr";

import "./InclusionConnectButton.scss";

export interface InclusionConnectButtonProps {
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  inclusionConnectEndpoint: string;
  layout?: "default" | "2-lines";
}

export const InclusionConnectButton = ({
  onClick,
  inclusionConnectEndpoint,
  layout = "default",
}: InclusionConnectButtonProps) => {
  const { cx } = useStyles();
  return (
    <a
      onClick={onClick}
      href={`/api/${inclusionConnectEndpoint}`}
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
