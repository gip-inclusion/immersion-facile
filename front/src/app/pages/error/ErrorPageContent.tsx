import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { ManagedErrorKind, domElementIds } from "shared";
import {
  contentsMapper,
  unexpectedErrorContent,
} from "src/app/contents/error/textSetup";
import {
  ErrorButton,
  ErrorButtonProps,
  HTTPFrontErrorContents,
} from "src/app/contents/error/types";
import { useRedirectToConventionWithoutIdentityProvider } from "src/app/hooks/redirections.hooks";

import ovoidSprite from "@codegouvfr/react-dsfr/dsfr/artwork/background/ovoid.svg";
import technicalErrorSprite from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/system/technical-error.svg";
import { RenewEstablishmentMagicLinkButton } from "src/app/pages/establishment/RenewEstablishmentMagicLinkButton";
import { routes, useRoute } from "src/app/routes/routes";
import { getJwtPayload } from "src/app/utils/jwt";
import { Route } from "type-route";

type ErrorPageContentProps = {
  type?: ManagedErrorKind;
  title?: string;
  message?: string;
  shouldShowRefreshEditEstablishmentLink: boolean;
};

const routeContainsJwt = (
  route: Route<typeof routes>,
): route is Route<typeof routes.editFormEstablishment> => {
  return "jwt" in route.params;
};

export const ErrorPageContent = ({
  type,
  title,
  message,
  shouldShowRefreshEditEstablishmentLink,
}: ErrorPageContentProps): React.ReactElement => {
  const route = useRoute() as Route<typeof routes>;
  const redirectAction = useRedirectToConventionWithoutIdentityProvider();
  const content: HTTPFrontErrorContents = type
    ? contentsMapper(redirectAction, message, title)[type]
    : unexpectedErrorContent(title ?? "", message ?? "");
  const siret = routeContainsJwt(route)
    ? getJwtPayload(route.params.jwt)?.siret
    : null;
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
          className={fr.cx("fr-text--sm", "fr-mb-3w")}
          dangerouslySetInnerHTML={{ __html: content.description }}
        />
        {shouldShowRefreshEditEstablishmentLink && siret && (
          <p className={fr.cx("fr-text--sm", "fr-mb-5w")}>
            <RenewEstablishmentMagicLinkButton
              id={domElementIds.establishment.edit.refreshEditLink}
              siret={siret}
            />
          </p>
        )}
        <ul className={fr.cx("fr-btns-group", "fr-btns-group--inline-md")}>
          {content.buttons.map((button: ErrorButton, index) => {
            const buttonProps: ErrorButtonProps =
              typeof button === "function"
                ? button({
                    currentUrl: window.location.href,
                    currentDate: new Date().toISOString(),
                    error: content.description,
                  })
                : button;
            return (
              <li key={`${buttonProps.kind}-${index}`}>
                {buttonProps.onClick ? (
                  <button
                    className={fr.cx(
                      "fr-btn",
                      buttonProps.kind !== "primary" &&
                        `fr-btn--${buttonProps.kind}`,
                    )}
                    onClick={buttonProps.onClick}
                    type="button"
                  >
                    {buttonProps.label}
                  </button>
                ) : (
                  <a
                    className={fr.cx(
                      "fr-btn",
                      buttonProps.kind !== "primary" &&
                        `fr-btn--${buttonProps.kind}`,
                    )}
                    href={buttonProps.href}
                    target={buttonProps.target}
                  >
                    {buttonProps.label}
                  </a>
                )}
              </li>
            );
          })}
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
          className={fr.cx("fr-responsive-img", "fr-artwork")}
          aria-hidden="true"
          width="160"
          height="200"
          viewBox="0 0 160 200"
        >
          <use
            className={fr.cx("fr-artwork-motif")}
            href={`${ovoidSprite}#artwork-motif`}
          />
          <use
            className={fr.cx("fr-artwork-background")}
            href={`${ovoidSprite}#artwork-background`}
          />
          <g transform="translate(40, 60)">
            <use
              className={fr.cx("fr-artwork-decorative")}
              href={`${technicalErrorSprite}#artwork-decorative`}
            />
            <use
              className={fr.cx("fr-artwork-minor")}
              href={`${technicalErrorSprite}#artwork-minor`}
            />
            <use
              className={fr.cx("fr-artwork-major")}
              href={`${technicalErrorSprite}#artwork-major`}
            />
          </g>
        </svg>
      </div>
    </div>
  );
};
