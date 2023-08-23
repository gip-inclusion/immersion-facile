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
import { ImmersionOfferLabels } from "src/app/components/search/ImmersionOfferLabels";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes, useRoute } from "src/app/routes/routes";
import { immersionOfferSelectors } from "src/core-logic/domain/immersionOffer/immersionOffer.selectors";
import { immersionOfferSlice } from "src/core-logic/domain/immersionOffer/immersionOffer.slice";

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

const ImmersionOfferSection = ({
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

export const ImmersionOfferPage = () => {
  const route = useRoute() as Route<typeof routes.immersionOffer>;
  const currentImmersionOffer = useAppSelector(
    immersionOfferSelectors.currentImmersionOffer,
  );
  const feedback = useAppSelector(immersionOfferSelectors.feedback);
  const isLoading = useAppSelector(immersionOfferSelectors.isLoading);
  const formContactRef = useRef<HTMLDivElement | null>(null);
  const dispatch = useDispatch();
  const [showConfirmationMessage, setShowConfirmationMessage] = useState<
    string | null
  >(null);
  useEffect(() => {
    dispatch(
      immersionOfferSlice.actions.fetchImmersionOfferRequested({
        siret: route.params.siret,
        appellationCode: route.params.appellationCode,
      }),
    );
  }, []);
  const pluralFromAppellations = (appellations: AppellationDto[] | undefined) =>
    appellations && appellations.length > 1 ? "s" : "";
  const onFormSubmitSuccess = () => {
    document.body.scrollIntoView({
      behavior: "smooth",
    });
    setShowConfirmationMessage(
      getFeedBackMessage(currentImmersionOffer?.contactMode),
    );
  };
  const scrollToContactForm = () => {
    formContactRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  };
  const onGoBackClick = () => {
    if (window.history.length > 2) {
      window.history.back();
      return;
    }
    routes.search().push();
  };
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <>
          {isLoading && <Loader />}
          {!currentImmersionOffer && feedback.kind === "errored" && (
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
          {currentImmersionOffer && showConfirmationMessage === null && (
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
              <ImmersionOfferLabels
                voluntaryToImmersion={
                  currentImmersionOffer.voluntaryToImmersion
                }
                contactMode={currentImmersionOffer.contactMode}
                fitForDisabledWorkers={
                  currentImmersionOffer.fitForDisabledWorkers
                }
              />
              <h1 className={fr.cx("fr-mb-4w", "fr-mt-2w")}>
                {currentImmersionOffer?.name}
              </h1>
              <ImmersionOfferSection title="Addresse">
                <>
                  <p>
                    {currentImmersionOffer?.address.streetNumberAndAddress}
                    {", "}
                    <span>
                      {currentImmersionOffer?.address.postcode}{" "}
                      {currentImmersionOffer?.address.city}
                    </span>
                  </p>
                  <p>
                    SIRET&nbsp;:{" "}
                    <a
                      href={makeSiretDescriptionLink(
                        currentImmersionOffer?.siret,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {currentImmersionOffer?.siret}
                    </a>
                  </p>
                </>
              </ImmersionOfferSection>
              <ImmersionOfferSection title="Secteur d'activité :">
                <p>
                  {currentImmersionOffer?.romeLabel} (
                  {currentImmersionOffer?.rome})
                </p>
              </ImmersionOfferSection>

              {currentImmersionOffer.appellations.length > 0 && (
                <ImmersionOfferSection
                  title={`Métier${pluralFromAppellations(
                    currentImmersionOffer?.appellations,
                  )} observable${pluralFromAppellations(
                    currentImmersionOffer?.appellations,
                  )} :`}
                >
                  <p>
                    {currentImmersionOffer?.appellations
                      .map((appellation) => `${appellation.appellationLabel}`)
                      .join(", ")}
                  </p>
                </ImmersionOfferSection>
              )}
              <ImmersionOfferSection>
                {currentImmersionOffer.voluntaryToImmersion && (
                  <Button type="button" onClick={scrollToContactForm}>
                    Contacter l'entreprise
                  </Button>
                )}

                {!currentImmersionOffer.voluntaryToImmersion && (
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
                          href: currentImmersionOffer?.urlOfPartner,
                        },
                        children: "Voir l'offre sur La Bonne Boite",
                      },
                    ]}
                  />
                )}
              </ImmersionOfferSection>
              <ImmersionOfferSection title="Nombre de salariés">
                <p>{currentImmersionOffer?.numberOfEmployeeRange}</p>
              </ImmersionOfferSection>

              {currentImmersionOffer?.additionalInformation && (
                <ImmersionOfferSection title="Informations complémentaires">
                  <p>{currentImmersionOffer?.additionalInformation}</p>
                </ImmersionOfferSection>
              )}

              {currentImmersionOffer.website && (
                <ImmersionOfferSection title="Site web">
                  <a
                    href={currentImmersionOffer.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {currentImmersionOffer.website}
                  </a>
                </ImmersionOfferSection>
              )}
              <ImmersionOfferSection title="Avoir plus d'informations avant de contacter l'entreprise">
                <ul>
                  {currentImmersionOffer.appellations.length > 0 && (
                    <li>
                      <a
                        href={makeAppellationInformationUrl(
                          currentImmersionOffer.appellations[0].appellationCode,
                          currentImmersionOffer.address.departmentCode,
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
                      href={makeNafClassInformationUrl(
                        currentImmersionOffer.naf,
                      )}
                      target="_blank"
                      rel="noreferrer"
                    >
                      S'informer sur le domaine
                    </a>
                  </li>
                  <li>
                    <a
                      href={getMapsLink(currentImmersionOffer)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Localiser l'entreprise
                    </a>
                  </li>
                </ul>
              </ImmersionOfferSection>

              <div>
                <div
                  className={fr.cx("fr-card", "fr-p-4w", "fr-mt-8w")}
                  ref={formContactRef}
                >
                  <h2 className={fr.cx("fr-h3", "fr-mb-2w")}>
                    {currentImmersionOffer.voluntaryToImmersion
                      ? "Contacter l'entreprise"
                      : "Nos conseils pour cette première prise de contact ! "}
                  </h2>
                  {match(currentImmersionOffer?.contactMode)
                    .with("EMAIL", () => (
                      <ContactByEmail
                        appellations={currentImmersionOffer.appellations}
                        siret={currentImmersionOffer.siret}
                        onSubmitSuccess={onFormSubmitSuccess}
                      />
                    ))
                    .with("PHONE", () => (
                      <ContactByPhone
                        appellations={currentImmersionOffer.appellations}
                        siret={currentImmersionOffer.siret}
                        onSubmitSuccess={onFormSubmitSuccess}
                      />
                    ))
                    .with("IN_PERSON", () => (
                      <ContactInPerson
                        appellations={currentImmersionOffer.appellations}
                        siret={currentImmersionOffer.siret}
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
                      {getFeedBackMessage(currentImmersionOffer?.contactMode)}
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
