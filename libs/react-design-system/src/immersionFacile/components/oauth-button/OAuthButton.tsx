import React from "react";
import { useStyles } from "tss-react/dsfr";
import "./OAuthButton.scss";

export interface OAuthButtonProps {
  inclusionConnectEndpoint: string;
  mode: "pro-connect" | "inclusion-connect";
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  layout?: "default" | "2-lines";
  id?: string;
}

// J'ignore juste le CSS Inclusion Connect quand mode pro-connect
// A toi de voir quelle implem/CSS/.... on fait
// Mais en soit ça fonctionne :)

export const OAuthButton = ({
  onClick,
  inclusionConnectEndpoint,
  layout = "default",
  id = "inclusion-connect-button",
  mode,
}: OAuthButtonProps) => {
  const { cx } = useStyles();
  return (
    // biome-ignore lint/a11y/useValidAnchor:
    <a
      onClick={onClick}
      href={`/api${inclusionConnectEndpoint}`}
      id={id}
      className={
        mode === "inclusion-connect"
          ? cx(
              "inclusion-connect-button",
              `inclusion-connect-button--${layout}`,
            )
          : ""
      }
    >
      <span
        className={
          mode === "inclusion-connect"
            ? cx("inclusion-connect-button__label")
            : ""
        }
      >
        Se connecter avec{" "}
        <strong
          className={
            mode === "inclusion-connect"
              ? cx("inclusion-connect-button__ic-label")
              : ""
          }
        >
          {mode === "inclusion-connect" ? "Inclusion Connect" : "Pro Connect"}
        </strong>
      </span>
    </a>
  );
};
