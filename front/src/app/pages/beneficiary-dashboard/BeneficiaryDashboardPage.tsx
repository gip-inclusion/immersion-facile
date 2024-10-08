import { fr } from "@codegouvfr/react-dsfr";
import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import beneficiaryFaqImg from "src/assets/img/beneficiary-faq.svg";

export const BeneficiaryDashboardPage = () => {
  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout="default"
        vSpacing={8}
        pageHeader={
          <PageHeader
            title="Vous n’avez pas besoin de compte pour utiliser Immersion Facilitée"
            breadcrumbs={<Breadcrumbs />}
          />
        }
      >
        <div className={fr.cx("fr-grid-row", "fr-grid-row--middle")}>
          <div className={fr.cx("fr-col-lg-8", "fr-col-12")}>
            <p>
              Vous rencontrez des difficultés ? Consultez nos articles d’aide !
            </p>
            <h2 className={"fr-mt-6w"}>Mon immersion commence bientôt</h2>
            <ul>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/comment-acceder-a-la-convention-une-fois-quelle-est-validee-o46xhq/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Comment accéder à la convention une fois qu'elle est
                  validée&nbsp;?
                </a>
              </li>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/comment-signer-ma-convention-ou-envoyer-un-lien-de-signature-si-je-nai-plus-le-lien-envoye-par-mail-125bxxd/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Comment signer ma convention ou envoyer un lien de signature ?
                </a>
              </li>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/comment-suivre-ma-demande-de-convention-1gbhxt4/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Comment suivre ma demande de convention ?
                </a>
              </li>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/les-etapes-de-validation-dune-convention-dimmersion-twqxi7/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Quelles sont les étapes de signature de la convention ?
                </a>
              </li>
            </ul>

            <h2 className={"fr-mt-6w"}> J’ai fini mon immersion</h2>
            <ul>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/le-bilan-de-limmersion-1q9asij/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Bilan de l'immersion
                </a>
              </li>
            </ul>

            <h2 className={"fr-mt-6w"}>
              Est-ce que l’immersion est faite pour moi ?
            </h2>
            <ul>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/category/candidat-jikpz1/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Guide de l’immersion
                </a>
              </li>
              <li>
                <a
                  href="https://tally.so/r/w2X7xV"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Je ne sais pas si je peux remplir une convention en ligne dans
                  mon cas
                </a>
              </li>
              <li>
                <a
                  href="https://immersion-facile.beta.gouv.fr/aide/article/je-nai-pas-de-structure-daccompagnement-et-je-veux-faire-une-immersion-1x15rdp/"
                  target="_blank"
                  rel="noreferrer"
                  className={fr.cx("fr-link")}
                >
                  Je n'ai pas de structure d'accompagnement
                </a>
              </li>
            </ul>
          </div>
          <div
            className={fr.cx(
              "fr-col-lg-4",
              "fr-col-12",
              "fr-hidden",
              "fr-unhidden-lg",
            )}
          >
            <img src={beneficiaryFaqImg} alt="" />
          </div>
        </div>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
