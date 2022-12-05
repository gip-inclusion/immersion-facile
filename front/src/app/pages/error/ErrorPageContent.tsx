import React from "react";
import { getErrorPageContents } from "src/app/contents/error/textSetup";
import { HTTPFrontErrorType, ErrorButton } from "src/app/contents/error/types";

type ErrorPageContentProps = {
  type: HTTPFrontErrorType;
};

export const ErrorPageContent = ({
  type,
}: ErrorPageContentProps): React.ReactElement => {
  const { overtitle, title, subtitle, description, buttons } =
    getErrorPageContents(type);
  return (
    <div className="fr-my-7w fr-mt-md-12w fr-mb-md-10w fr-grid-row fr-grid-row--gutters fr-grid-row--middle fr-grid-row--center">
      <div className="fr-py-0 fr-col-12 fr-col-md-6">
        {overtitle && <h1>{overtitle}</h1>}
        {title && <p className="fr-text--sm fr-mb-3w">{title}</p>}
        {subtitle && <p className="fr-text--lead fr-mb-3w">{subtitle}</p>}
        {description && (
          <p
            className="fr-text--sm fr-mb-5w"
            dangerouslySetInnerHTML={{ __html: description }}
          />
        )}
        {buttons && !!buttons.length && (
          <ul className="fr-btns-group fr-btns-group--inline-md">
            {buttons.map((button: ErrorButton) => (
              <li>
                <a
                  className={`fr-btn fr-btn--${button.type}`}
                  href={button.href}
                >
                  {button.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="fr-col-12 fr-col-md-3 fr-col-offset-md-1 fr-px-6w fr-px-md-0 fr-py-0">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="fr-responsive-img fr-artwork"
          aria-hidden="true"
          width="160"
          height="200"
          viewBox="0 0 160 200"
        >
          <use
            className="fr-artwork-motif"
            href="/node_modules/@gouvfr/dsfr/dist/artwork/background/ovoid.svg#artwork-motif"
          ></use>
          <use
            className="fr-artwork-background"
            href="/node_modules/@gouvfr/dsfr/dist/artwork/background/ovoid.svg#artwork-background"
          ></use>
          <g transform="translate(40, 60)">
            <use
              className="fr-artwork-decorative"
              href="/node_modules/@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg#artwork-decorative"
            ></use>
            <use
              className="fr-artwork-minor"
              href="/node_modules/@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg#artwork-minor"
            ></use>
            <use
              className="fr-artwork-major"
              href="/node_modules/@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg#artwork-major"
            ></use>
          </g>
        </svg>
      </div>
    </div>
  );
};
