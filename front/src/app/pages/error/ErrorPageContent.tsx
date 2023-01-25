import ovoidSprite from "@gouvfr/dsfr/dist/artwork/background/ovoid.svg";
import technicalErrorSprite from "@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg";
import React from "react";
import { ManagedErrorKind } from "shared";
import {
  contentsMapper,
  unexpectedErrorContent,
} from "src/app/contents/error/textSetup";
import {
  ErrorButton,
  HTTPFrontErrorContents,
} from "src/app/contents/error/types";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";

type ErrorPageContentProps = {
  type?: ManagedErrorKind;
  title?: string;
  message?: string;
};

export const ErrorPageContent = ({
  type,
  title,
  message,
}: ErrorPageContentProps): React.ReactElement => {
  const { cx } = useStyles();
  const content: HTTPFrontErrorContents = type
    ? contentsMapper(
        useRedirectToConventionWithoutIdentityProvider(),
        message,
        title,
      )[type]
    : unexpectedErrorContent(title ?? "", message ?? "");
  return (
    <div
      className={fr.cx(
        "fr-my-7w",
        "fr-mt-md-12w",
        "fr-mb-md-10w",
        "fr-grid-row",
        "fr-grid-row--gutters",
        "fr-grid-row--middle",
        "fr-grid-row--center",
      )}
    >
      <div className={fr.cx("fr-py-0", "fr-col-12", "fr-col-md-6")}>
        <h1>{content.overtitle}</h1>
        <p className={fr.cx("fr-text--sm", "fr-mb-3w")}>{content.title}</p>
        <p className={fr.cx("fr-text--lead", "fr-mb-3w")}>{content.subtitle}</p>
        <p
          className={fr.cx("fr-text--sm", "fr-mb-5w")}
          dangerouslySetInnerHTML={{ __html: content.description }}
        />
        <ul className={fr.cx("fr-btns-group", "fr-btns-group--inline-md")}>
          {content.buttons.map((button: ErrorButton) => (
            <li>
              {button.onClick ? (
                <button
                  className={cx(fr.cx("fr-btn"), `fr-btn--${button.kind}`)}
                  onClick={button.onClick}
                >
                  {button.label}
                </button>
              ) : (
                <a
                  className={cx(fr.cx("fr-btn"), `fr-btn--${button.kind}`)}
                  href={button.href}
                  target={button.target}
                >
                  {button.label}
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
      <div
        className={fr.cx(
          "fr-col-12",
          "fr-col-md-3",
          "fr-col-offset-md-1",
          "fr-px-6w",
          "fr-px-md-0",
          "fr-py-0",
        )}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={cx(fr.cx("fr-responsive-img"), "fr-artwork")}
          aria-hidden="true"
          width="160"
          height="200"
          viewBox="0 0 160 200"
        >
          <use
            className={fr.cx("fr-artwork-motif")}
            href={`${ovoidSprite}#artwork-motif`}
          ></use>
          <use
            className={fr.cx("fr-artwork-background")}
            href={`${ovoidSprite}#artwork-background`}
          ></use>
          <g transform="translate(40, 60)">
            <use
              className={fr.cx("fr-artwork-decorative")}
              href={`${technicalErrorSprite}#artwork-decorative`}
            ></use>
            <use
              className={fr.cx("fr-artwork-minor")}
              href={`${technicalErrorSprite}#artwork-minor`}
            ></use>
            <use
              className={fr.cx("fr-artwork-major")}
              href={`${technicalErrorSprite}#artwork-major`}
            ></use>
          </g>
        </svg>
      </div>
    </div>
  );
};
