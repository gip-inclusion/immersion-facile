import { ProConnectButton } from "@codegouvfr/react-dsfr/ProConnectButton";
import React from "react";
import { useStyles } from "tss-react/dsfr";
import "./OAuthButton.scss";

export interface OAuthButtonProps {
  authenticationEndpoint: string;
  provider: "pro-connect" | "inclusion-connect";
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  layout?: "default" | "2-lines";
  id?: string;
}

export const OAuthButton = ({
  onClick,
  authenticationEndpoint,
  layout = "default",
  id = "inclusion-connect-button",
  provider,
}: OAuthButtonProps) => {
  const { cx } = useStyles();
  return provider === "pro-connect" ? (
    <ProConnectButton id={id} url={`/api${authenticationEndpoint}`} />
  ) : (
    // biome-ignore lint/a11y/useValidAnchor:
    <a
      onClick={onClick}
      href={`/api${authenticationEndpoint}`}
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
