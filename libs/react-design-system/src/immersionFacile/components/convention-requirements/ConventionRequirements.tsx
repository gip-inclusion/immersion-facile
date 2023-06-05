import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { useStyles } from "tss-react/dsfr";
import "./ConventionRequirements.scss";

const componentName = "im-convention-requirements";
export const ConventionRequirements = () => {
  const { cx } = useStyles();
  return (
    <aside
      className={cx(fr.cx("fr-px-6w", "fr-py-8w"), componentName)}
      aria-label="Prérequis au formulaire de demande de convention"
    >
      <div className={`${componentName}__content`}>
        <h2 className={cx(cx(fr.cx("fr-h4"), `${componentName}__title`))}>
          Avant de commencer !
        </h2>

        <ul className={cx(`${componentName}__list`)}>
          <li className={cx(fr.cx("fr-my-2w"), `${componentName}__item`)}>
            <span
              className={cx(
                fr.cx("fr-icon-questionnaire-line"),
                `${componentName}__item-icon`,
              )}
            ></span>
            <span className={cx(`${componentName}__item-content`)}>
              <a
                href="https://tally.so/r/w2X7xV"
                target="_blank"
                rel="noreferrer"
              >
                <strong>Vérifiez</strong>
              </a>{" "}
              si vous pouvez faire votre demande de convention en ligne.
            </span>
          </li>
          <li className={cx(fr.cx("fr-my-2w"), `${componentName}__item`)}>
            <span
              className={cx(
                fr.cx("fr-icon-time-line"),
                `${componentName}__item-icon`,
              )}
            ></span>
            <span className={cx(`${componentName}__item-content`)}>
              Prévoyez environ <strong>5 minutes</strong> de temps libre pour
              remplir le formulaire.
            </span>
          </li>
          <li className={cx(fr.cx("fr-my-2w"), `${componentName}__item`)}>
            <span
              className={cx(
                fr.cx("fr-icon-mail-line"),
                `${componentName}__item-icon`,
              )}
            ></span>
            <span className={cx(`${componentName}__item-content`)}>
              Préparez l’<strong>email de l’entreprise</strong> où vous
              souhaitez faire votre immersion, ou bien remplissez le formulaire
              avec elle.
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
};
