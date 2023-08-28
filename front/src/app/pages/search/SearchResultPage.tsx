import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { match, P } from "ts-pattern";
import { Route } from "type-route";
import {
  AppellationDto,
  ContactMethod,
  getMapsLink,
  makeAppellationInformationUrl,
  makeNafClassInformationUrl,
  makeSiretDescriptionLink,
} from "shared";
import { Loader, MainWrapper } from "react-design-system";
import { ContactByEmail } from "src/app/components/immersion-offer/ContactByEmail";
import { ContactByPhone } from "src/app/components/immersion-offer/ContactByPhone";
import { ContactInPerson } from "src/app/components/immersion-offer/ContactInPerson";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { SearchResultLabels } from "src/app/components/search/SearchResultLabels";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes, useRoute } from "src/app/routes/routes";
import { searchSelectors } from "src/core-logic/domain/search/search.selectors";
import { searchSlice } from "src/core-logic/domain/search/search.slice";

const getFeedBackMessage = (contactMethod?: ContactMethod) => {
  switch (contactMethod) {
    case "EMAIL":
      return "L'entreprise a été contactée avec succès.";
    case "PHONE":
    case "IN_PERSON":
      return "Un email vient de vous être envoyé.";
    default:
      return null;
  }
};

const SearchResultSection = ({
  title,
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) => (
  <div className={fr.cx("fr-mb-4w")}>
    <h2 className={fr.cx("fr-text--md", "fr-mb-1v")}>{title}</h2>
    {children}
  </div>
);

export const SearchResultPage = () => {
  const route = useRoute() as Route<
    typeof routes.searchResult | typeof routes.searchResultExternal
  >;
  const currentSearchResult = useAppSelector(
    searchSelectors.currentSearchResult,
  );
  const feedback = useAppSelector(searchSelectors.feedback);
  const isLoading = useAppSelector(searchSelectors.isLoading);
  const formContactRef = useRef<HTMLDivElement | null>(null);
  const [shouldShowError, setShouldShowError] = useState<boolean>(false);
  const dispatch = useDispatch();
  const [showConfirmationMessage, setShowConfirmationMessage] = useState<
    string | null
  >(null);
  useEffect(() => {
    if ("appellationCode" in route.params) {
      dispatch(
        searchSlice.actions.fetchSearchResultRequested({
          siret: route.params.siret,
          appellationCode: route.params.appellationCode,
        }),
      );
    } else {
      setShouldShowError(true);
    }
  }, []);
  const pluralFromAppellations = (appellations: AppellationDto[] | undefined) =>
    appellations && appellations.length > 1 ? "s" : "";
  const onFormSubmitSuccess = () => {
    document.body.scrollIntoView({
      behavior: "smooth",
    });
    setShowConfirmationMessage(
      getFeedBackMessage(currentSearchResult?.contactMode),
    );
  };
  const scrollToContactForm = () => {
    formContactRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };
  const onGoBackClick = () =>
    window.history.length > 2 ? window.history.back() : routes.search().push();

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <>
          {isLoading && <Loader />}
          {!currentSearchResult &&
            (feedback.kind === "errored" || shouldShowError) && (
              <>
                <Alert
                  title="Oups !"
                  description="L'offre ne peut plus être affichée, veuillez relancer une recherche d'offre d'immersion pour retrouver une offre."
                  severity="error"
                  className={fr.cx("fr-my-4w")}
                />
                <Button
                  type="button"
                  onClick={onGoBackClick}
                  priority="tertiary"
                  iconId="fr-icon-arrow-left-line"
                  iconPosition="left"
                  className={fr.cx("fr-mt-1w")}
                >
                  Retour à la recherche
                </Button>
              </>
            )}
          {currentSearchResult && showConfirmationMessage === null && (
            <>
              <div className={fr.cx("fr-mb-4w")}>
                <Button
                  type="button"
                  onClick={onGoBackClick}
                  priority="tertiary no outline"
                  iconId="fr-icon-arrow-left-line"
                  iconPosition="left"
                >
                  Retour
                </Button>
              </div>
              <SearchResultLabels
                voluntaryToImmersion={currentSearchResult.voluntaryToImmersion}
                contactMode={currentSearchResult.contactMode}
                fitForDisabledWorkers={
                  currentSearchResult.fitForDisabledWorkers
                }
              />
              <h1 className={fr.cx("fr-mb-4w", "fr-mt-2w")}>
                {currentSearchResult.name}
              </h1>
              <SearchResultSection title="Addresse">
                <>
                  <p>
                    {currentSearchResult.address.streetNumberAndAddress}
                    {", "}
                    <span>
                      {currentSearchResult.address.postcode}{" "}
                      {currentSearchResult.address.city}
                    </span>
                  </p>
                  <p>
                    SIRET&nbsp;:{" "}
                    <a
                      href={makeSiretDescriptionLink(currentSearchResult.siret)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {currentSearchResult.siret}
                    </a>
                  </p>
                </>
              </SearchResultSection>
              <SearchResultSection title="Secteur d'activité :">
                <p>
                  {currentSearchResult.romeLabel} ({currentSearchResult.rome})
                </p>
              </SearchResultSection>

              {currentSearchResult.appellations.length > 0 && (
                <SearchResultSection
                  title={`Métier${pluralFromAppellations(
                    currentSearchResult.appellations,
                  )} observable${pluralFromAppellations(
                    currentSearchResult.appellations,
                  )} :`}
                >
                  <p>
                    {currentSearchResult.appellations
                      .map((appellation) => `${appellation.appellationLabel}`)
                      .join(", ")}
                  </p>
                </SearchResultSection>
              )}
              <SearchResultSection>
                {currentSearchResult.voluntaryToImmersion && (
                  <Button type="button" onClick={scrollToContactForm}>
                    Contacter l'entreprise
                  </Button>
                )}

                {!currentSearchResult.voluntaryToImmersion && (
                  <ButtonsGroup
                    inlineLayoutWhen="md and up"
                    buttons={[
                      {
                        onClick: scrollToContactForm,
                        children: "Voir nos conseils",
                        priority: "secondary",
                      },
                      {
                        linkProps: {
                          href: currentSearchResult.urlOfPartner,
                          target: "_blank",
                        },
                        children: "Voir l'offre sur La Bonne Boite",
                      },
                    ]}
                  />
                )}
              </SearchResultSection>
              <SearchResultSection title="Nombre de salariés">
                <p>{currentSearchResult.numberOfEmployeeRange}</p>
              </SearchResultSection>

              {currentSearchResult.additionalInformation && (
                <SearchResultSection title="Informations complémentaires">
                  <p>{currentSearchResult.additionalInformation}</p>
                </SearchResultSection>
              )}

              {currentSearchResult.website && (
                <SearchResultSection title="Site web">
                  <a
                    href={currentSearchResult.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {currentSearchResult.website}
                  </a>
                </SearchResultSection>
              )}
              <SearchResultSection title="Avoir plus d'informations avant de contacter l'entreprise">
                <ul>
                  {currentSearchResult.appellations.length > 0 && (
                    <li>
                      <a
                        href={makeAppellationInformationUrl(
                          currentSearchResult.appellations[0].appellationCode,
                          currentSearchResult.address.departmentCode,
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        S'informer sur le métier
                      </a>
                    </li>
                  )}
                  <li>
                    <a
                      href={makeNafClassInformationUrl(currentSearchResult.naf)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      S'informer sur le domaine
                    </a>
                  </li>
                  <li>
                    <a
                      href={getMapsLink(currentSearchResult)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Localiser l'entreprise
                    </a>
                  </li>
                </ul>
              </SearchResultSection>

              <div>
                <div
                  className={fr.cx("fr-card", "fr-p-4w", "fr-mt-8w")}
                  ref={formContactRef}
                >
                  <h2 className={fr.cx("fr-h3", "fr-mb-2w")}>
                    {currentSearchResult.voluntaryToImmersion
                      ? "Contacter l'entreprise"
                      : "Nos conseils pour cette première prise de contact ! "}
                  </h2>
                  {match(currentSearchResult.contactMode)
                    .with("EMAIL", () => (
                      <ContactByEmail
                        appellations={currentSearchResult.appellations}
                        siret={currentSearchResult.siret}
                        onSubmitSuccess={onFormSubmitSuccess}
                      />
                    ))
                    .with("PHONE", () => (
                      <ContactByPhone
                        appellations={currentSearchResult.appellations}
                        siret={currentSearchResult.siret}
                        onSubmitSuccess={onFormSubmitSuccess}
                      />
                    ))
                    .with("IN_PERSON", () => (
                      <ContactInPerson
                        appellations={currentSearchResult.appellations}
                        siret={currentSearchResult.siret}
                        onSubmitSuccess={onFormSubmitSuccess}
                      />
                    ))
                    .with(P.nullish, () => (
                      <div>
                        <h3 className={fr.cx("fr-h6")}>
                          Comment présenter votre demande ?{" "}
                        </h3>
                        <p className={fr.cx("fr-mb-2w")}>
                          Soyez <strong>direct, concret et courtois</strong>.
                          Présentez-vous, présentez simplement votre projet et
                          l’objectif que vous recherchez en effectuant une
                          immersion.
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          <strong>Par exemple : </strong>
                          <span>
                            “Je souhaite devenir mécanicien auto et je voudrais
                            découvrir comment ce métier se pratique dans un
                            garage comme le vôtre. Ca me permettra de vérifier
                            que cela me plaît vraiment. La personne qui
                            m’accueillera et me présentera le métier pourra
                            aussi vérifier si ce métier est fait pour moi.”
                          </span>
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          Vous pouvez indiquer à votre interlocutrice ou
                          interlocuteur que{" "}
                          <strong>
                            cette immersion sera encadrée par une convention
                            signée par l'organisme qui vous suit.
                          </strong>
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          Indiquez lui le moment où vous aimeriez faire une
                          immersion et pourquoi vous voulez la faire à cette
                          date.
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          <strong>Par exemple : </strong>
                          <span>
                            “il faudrait que je fasse une immersion avant de
                            m’inscrire à une formation. “
                          </span>
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          Indiquez également le <strong>nombre de jours</strong>{" "}
                          que vous aimeriez faire en immersion si vous le savez
                          déjà.
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          Concluez en lui demandant{" "}
                          <strong>un rendez-vous</strong> pour qu’il/elle se
                          rende compte du sérieux de votre projet.
                        </p>

                        <h3 className={fr.cx("fr-h6")}>
                          Comment expliquer simplement ce qu’est une immersion ?
                        </h3>
                        <p className={fr.cx("fr-mb-2w")}>
                          C’est un stage d’observation, strictement encadré d’un
                          point de vue juridique. Vous conservez votre statut et
                          êtes couvert par votre Pôle emploi,votre Mission
                          Locale ou le Conseil départemental (en fonction de
                          votre situation).
                        </p>
                        <p className={fr.cx("fr-mb-2w")}>
                          Le rôle de celui qui vous accueillera est de vous
                          présenter le métier et de vérifier avec vous que ce
                          métier vous convient en vous faisant des retours les
                          plus objectifs possibles. Pendant la durée de votre
                          présence, vous pouvez aider les salariés en donnant un
                          coup de main mais vous n’êtes pas là pour remplacer un
                          collègue absent.
                        </p>

                        <h3 className={fr.cx("fr-h6")}>
                          Quelle est la durée d’une immersion ?
                        </h3>
                        <p className={fr.cx("fr-mb-2w")}>
                          Les immersions se font le plus souvent pendant une
                          semaine ou deux.{" "}
                          <strong>
                            Il n’est pas possible de dépasser un mois
                          </strong>
                          . Il est possible de faire une immersion de seulement
                          un ou deux jours mais vous ne découvrirez pas
                          parfaitement un métier.
                        </p>

                        <h3 className={fr.cx("fr-h6")}>Bon à savoir ! </h3>
                        <p className={fr.cx("fr-mb-2w")}>
                          <strong>
                            Il n’est pas nécessaire d’apporter votre CV
                          </strong>
                          . Vous êtes là pour demander à découvrir un métier et
                          c’est ce projet qui est important, pas vos expériences
                          professionnelles ni votre formation !
                        </p>
                      </div>
                    ))
                    .exhaustive()}
                </div>
              </div>
            </>
          )}
          {showConfirmationMessage && (
            <>
              <Alert
                title="Bravo !"
                description={
                  <>
                    <p>
                      {getFeedBackMessage(currentSearchResult?.contactMode)}
                    </p>
                  </>
                }
                severity="success"
                className={fr.cx("fr-my-4w")}
              />
              <Button
                type="button"
                onClick={onGoBackClick}
                priority="tertiary"
                iconId="fr-icon-arrow-left-line"
                iconPosition="left"
                className={fr.cx("fr-mt-1w")}
              >
                Retour à la recherche
              </Button>
            </>
          )}
        </>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
