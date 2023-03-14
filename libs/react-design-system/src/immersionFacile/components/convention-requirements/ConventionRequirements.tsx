import React from "react";
import { useStyles } from "tss-react/dsfr";
import { fr } from "@codegouvfr/react-dsfr";
import "./ConventionRequirements.scss";

const componentName = "im-convention-requirements";
export const ConventionRequirements = () => {
  const { cx } = useStyles();
  return (
    <aside className={cx(fr.cx("fr-px-6w", "fr-py-8w"), componentName)}>
      <div className={`${componentName}__content`}>
        <h2 className={cx(cx(fr.cx("fr-h4"), `${componentName}__title`))}>
          Avant de commencer !
        </h2>
        <p>Vous aurez besoin :</p>
        <ul className={cx(`${componentName}__list`)}>
          <li className={cx(fr.cx("fr-my-2w"), `${componentName}__item`)}>
            <span
              className={cx(
                fr.cx("fr-icon-time-line"),
                `${componentName}__item-icon`,
              )}
            ></span>
            <span className={cx(`${componentName}__item-content`)}>
              D’environ <strong>10 minutes</strong> de temps libre.
            </span>
          </li>
          <li className={cx(fr.cx("fr-my-2w"), `${componentName}__item`)}>
            <span
              className={cx(
                fr.cx("fr-icon-map-pin-2-line"),
                `${componentName}__item-icon`,
              )}
            ></span>
            <span className={cx(`${componentName}__item-content`)}>
              D’avoir une <strong>structure d’accompagnement</strong> : Pôle
              emploi, Mission locale, Cap Emploi... Si vous n'avez pas de
              structure d'accompagnement,{" "}
              <a
                href="https://aide.immersion-facile.beta.gouv.fr/fr/article/je-nai-pas-de-structure-daccompagnement-et-je-veux-faire-une-immersion-1x15rdp/"
                target="_blank"
              >
                retrouvez nos conseils ici
              </a>
              .
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
              D’avoir l’
              <strong>email de l’entreprise</strong> où vous souhaitez faire
              votre immersion, ou bien de remplir le formulaire avec elle.
            </span>
          </li>
        </ul>
      </div>
    </aside>
  );
};
