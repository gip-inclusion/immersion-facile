import { fr } from "@codegouvfr/react-dsfr";
import type React from "react";
import type { FrontErrorProps } from "src/app/contents/error/types";

import ovoidSprite from "@codegouvfr/react-dsfr/dsfr/artwork/background/ovoid.svg";
import technicalErrorSprite from "@codegouvfr/react-dsfr/dsfr/artwork/pictograms/system/technical-error.svg";

type ErrorPageContentProps = FrontErrorProps;

export const ErrorPageContent = ({
  title,
  subtitle,
  description,
  buttons,
}: ErrorPageContentProps): React.ReactElement => {
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
        <h1>{title}</h1>
        <p className={fr.cx("fr-text--lead", "fr-mb-3w")}>{subtitle}</p>
        <p
          className={fr.cx("fr-text--sm", "fr-mb-3w")}
          dangerouslySetInnerHTML={{ __html: description }}
        />
        <ul className={fr.cx("fr-btns-group", "fr-btns-group--inline-md")}>
          {buttons.length
            ? buttons.map((button) => (
                <li>
                  {typeof button === "function"
                    ? button({
                        currentUrl: window.location.href,
                        currentDate: new Date().toISOString(),
                        error: description,
                      })
                    : button}
                </li>
              ))
            : null}
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
