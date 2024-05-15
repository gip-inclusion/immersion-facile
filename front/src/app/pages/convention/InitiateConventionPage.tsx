import { fr } from "@codegouvfr/react-dsfr/fr";
import { useState } from "react";
import { MainWrapper, NavCard, PageHeader } from "react-design-system";
import { domElementIds, loginPeConnect } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes, useRoute } from "src/app/routes/routes";
import { Route } from "type-route";

export const InitiateConventionPage = () => {
  const route = useRoute() as Route<typeof routes.initiateConvention>;
  const [showCandidateOptions, setShowCandidateOptions] = useState<boolean>(
    route.params.skipFirstStep !== undefined,
  );

  return (
    <HeaderFooterLayout>
      <MainWrapper
        layout="default"
        pageHeader={
          <PageHeader
            title={
              showCandidateOptions
                ? "Qui vous accompagne dans votre projet d'immersion ?"
                : "Remplir la demande de convention"
            }
          />
        }
      >
        {showCandidateOptions && (
          <section>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
              <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
                <NavCard
                  title="Je suis accompagné(e) par mon conseiller France Travail"
                  icon="fr-icon-parent-line"
                  type="candidate"
                  total={1}
                  id="TODO-ADD-ID"
                  link={{
                    href: `/api/${loginPeConnect}`,
                    id: domElementIds.conventionImmersionRoute
                      .initiateConventionSection.ftConnectButton,
                  }}
                  withBorder
                />
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
                <NavCard
                  title="Je suis accompagné(e) par une autre structure"
                  icon="fr-icon-team-line"
                  type="candidate"
                  total={1}
                  id="TODO-ADD-ID"
                  link={routes.conventionImmersion().link}
                  withBorder
                  alternateTitle="Si vous n'êtes pas accompagné par France Travail (CAP Emploi, Mission locales, etc), cliquez ici"
                />
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-md-4")}>
                <NavCard
                  title="Je n'ai pas encore de structure d'accompagnement"
                  icon="fr-icon-alarm-warning-line"
                  type="candidate"
                  total={1}
                  id="TODO-ADD-ID"
                  link={{
                    href: "https://aide.immersion-facile.beta.gouv.fr/fr/article/je-nai-pas-de-structure-daccompagnement-et-je-veux-faire-une-immersion-1x15rdp/",
                    target: "_blank",
                  }}
                  withBorder
                />
              </div>
            </div>
            <div
              className={fr.cx(
                "fr-mt-5w",
                "fr-btns-group",
                "fr-btns-group--center",
              )}
            >
              <a
                id={
                  domElementIds.conventionImmersionRoute
                    .initiateConventionSection.canIFillOnline
                }
                href="https://tally.so/r/w2X7xV"
                target="_blank"
                className={fr.cx(
                  "fr-link",
                  "fr-icon-arrow-right-line",
                  "fr-link--icon-right",
                )}
                rel="noreferrer"
              >
                Je ne sais pas si je peux remplir une convention en ligne dans
                mon cas
              </a>
            </div>
          </section>
        )}
        {!showCandidateOptions && (
          <section>
            <div className={fr.cx("fr-grid-row", "fr-grid-row--gutters")}>
              <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
                <NavCard
                  title="Je vais faire une immersion dans une entreprise"
                  icon="fr-icon-user-line"
                  overtitle="Candidat"
                  total={1}
                  type="candidate"
                  id={domElementIds.initiateConvention.navCards.candidate}
                  onClick={() => setShowCandidateOptions(true)}
                  withBorder
                />
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
                <NavCard
                  title="Je vais accueillir un candidat dans mon entreprise"
                  icon="fr-icon-building-line"
                  overtitle="Entreprise"
                  total={1}
                  type="establishment"
                  id={domElementIds.initiateConvention.navCards.establishment}
                  link={routes.conventionImmersion().link}
                  withBorder
                />
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
                <NavCard
                  title="J'accompagne un bénéficiaire d'immersion"
                  icon="fr-icon-map-pin-user-line"
                  overtitle="Agence"
                  total={1}
                  type="agency"
                  id={domElementIds.initiateConvention.navCards.agency}
                  link={routes.conventionImmersion().link}
                  withBorder
                />
              </div>
              <div className={fr.cx("fr-col-12", "fr-col-md-3")}>
                <NavCard
                  title="J'ai déjà rempli une convention mais j'ai un problème"
                  icon="fr-icon-alarm-warning-line"
                  overtitle="Tous"
                  total={1}
                  type="default"
                  id={domElementIds.initiateConvention.navCards.help}
                  link={{
                    href: "https://tally.so/r/mBdQQe",
                    target: "_blank",
                  }}
                  withBorder
                />
              </div>
            </div>
            <div
              className={fr.cx(
                "fr-mt-5w",
                "fr-btns-group",
                "fr-btns-group--center",
              )}
            >
              <a
                id={
                  domElementIds.conventionImmersionRoute
                    .initiateConventionSection.canIFillOnline
                }
                href="https://tally.so/r/w2X7xV"
                className={fr.cx(
                  "fr-link",
                  "fr-icon-arrow-right-line",
                  "fr-link--icon-right",
                )}
              >
                Je ne sais pas à quelle catégorie j'appartiens
              </a>
            </div>
          </section>
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
