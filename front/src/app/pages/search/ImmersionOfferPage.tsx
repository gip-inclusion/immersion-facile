import React, { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import { match, P } from "ts-pattern";
import { Route } from "type-route";
import {
  AppellationDto,
  ContactMethod,
  getMapsLink,
  makeSiretDescriptionLink,
} from "shared";
import { MainWrapper } from "react-design-system";
import { ContactByEmail } from "src/app/components/immersion-offer/ContactByEmail";
import { ContactByPhone } from "src/app/components/immersion-offer/ContactByPhone";
import { ContactInPerson } from "src/app/components/immersion-offer/ContactInPerson";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
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

const renderSection = ({
  title,
  content,
}: {
  title?: string;
  content: React.ReactNode;
}) => (
  <div className={fr.cx("fr-mb-4w")}>
    <h2 className={fr.cx("fr-h6", "fr-mb-1w")}>{title}</h2>
    {content}
  </div>
);

export const ImmersionOfferPage = () => {
  const route = useRoute() as Route<typeof routes.immersionOffer>;
  const currentImmersionOffer = useAppSelector(
    immersionOfferSelectors.currentImmersionOffer,
  );
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
          {currentImmersionOffer && showConfirmationMessage === null && (
            <>
              <div className={fr.cx("fr-mb-4w")}>
                <Button
                  type="button"
                  onClick={onGoBackClick}
                  priority="tertiary"
                  iconId="fr-icon-arrow-left-line"
                  iconPosition="left"
                >
                  Retour
                </Button>
              </div>
              <h1 className={fr.cx("fr-mb-4w")}>
                {currentImmersionOffer?.name}
              </h1>
              {renderSection({
                content: (
                  <>
                    <p>
                      {currentImmersionOffer?.address.streetNumberAndAddress}
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
                ),
              })}
              {renderSection({
                title: `Métier${pluralFromAppellations(
                  currentImmersionOffer?.appellations,
                )} observable${pluralFromAppellations(
                  currentImmersionOffer?.appellations,
                )} :`,
                content: (
                  <p>
                    {currentImmersionOffer?.appellations
                      .map((appellation) => `${appellation.appellationLabel}`)
                      .join(", ")}
                  </p>
                ),
              })}
              {renderSection({
                content: (
                  <Button type="button" onClick={scrollToContactForm}>
                    Contacter l'entreprise
                  </Button>
                ),
              })}
              {renderSection({
                title: "Nombre de salariés",
                content: <p>{currentImmersionOffer?.numberOfEmployeeRange}</p>,
              })}
              {renderSection({
                title: "Informations complémentaires",
                content: <p>{currentImmersionOffer?.additionalInformation}</p>,
              })}
              {currentImmersionOffer.website &&
                renderSection({
                  title: "Site web",
                  content: (
                    <a
                      href={currentImmersionOffer.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {currentImmersionOffer.website}
                    </a>
                  ),
                })}
              {renderSection({
                title:
                  "Avoir plus d'informations avant de contacter l'entreprise",
                content: (
                  <ul>
                    <li>
                      <a
                        href={`https://candidat.pole-emploi.fr/marche-du-travail/fichemetierrome?codeRome=${
                          currentImmersionOffer?.appellations.at(0)
                            ?.appellationCode
                        }`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        S'informer sur le métier
                      </a>
                    </li>
                    <li>
                      <a
                        href={`https://candidat.pole-emploi.fr/marche-du-travail/fichemetierrome?codeRome=${currentImmersionOffer?.rome}`}
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
                ),
              })}
              <div>
                <div
                  className={fr.cx("fr-card", "fr-p-4w", "fr-mt-8w")}
                  ref={formContactRef}
                >
                  <h2 className={fr.cx("fr-h3", "fr-mb-2w")}>
                    Contacter l'entreprise
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
                        <p>Il n'y a pas de contact pour cette offre</p>
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
                }
                severity="success"
                className={fr.cx("fr-my-4w")}
              />
            </>
          )}
        </>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
