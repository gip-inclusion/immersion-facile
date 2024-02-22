import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import Button from "@codegouvfr/react-dsfr/Button";
import React, { useEffect } from "react";
import { MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import { ConventionJwtPayload, decodeJwtWithoutSignatureCheck } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { routes } from "src/app/routes/routes";
import formIntroIllustration from "src/assets/img/form-establishment-intro.webp";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { establishmentLeadStatus } from "src/core-logic/domain/establishmentLead/establishmentLead.selectors";
import { establishmentLeadSlice } from "src/core-logic/domain/establishmentLead/establishmentLead.slice";
import { Route } from "type-route";

type EstablishmentFormForExternalsProps = {
  route: Route<typeof routes.unregisterEstablishmentLead>;
};

export const EstablishmentLeadRegistrationRejectedPage = ({
  route,
}: EstablishmentFormForExternalsProps) => {
  const { params } = route;
  const dispatch = useDispatch();
  const fetchedConvention = useAppSelector(conventionSelectors.convention);
  const establishmentLeadUnsubcriptionStatus = useAppSelector(
    establishmentLeadStatus,
  );

  console.log("fetchedConvention", fetchedConvention);

  const { applicationId } =
    decodeJwtWithoutSignatureCheck<ConventionJwtPayload>(params.jwt);

  useEffect(() => {
    dispatch(
      conventionSlice.actions.fetchConventionRequested({
        jwt: params.jwt,
        conventionId: applicationId,
      }),
    );
    dispatch(
      establishmentLeadSlice.actions.unsubscribeEstablishmentLeadRequested(
        params.jwt,
      ),
    );
  }, [applicationId, dispatch, params.jwt]);

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default">
        {establishmentLeadUnsubcriptionStatus === "success" && (
          <Alert
            className={fr.cx("fr-mb-6w")}
            severity="success"
            title="Bien reçu !"
            description="Nous ne vous enverrons plus d'emails pour vous proposer de vous inscrire sur notre annuaire d'entreprises accueillantes. Note : vous continuerez à recevoir des emails de signature de convention à l'adresse nom.prenom@domain.fr si vous remplissez de nouvelles demandes à l'avenir."
            closable
          />
        )}

        <section className={fr.cx("fr-grid-row", "fr-grid-row--center")}>
          <div className={fr.cx("fr-col-lg-6", "fr-col-12")}>
            <h1>
              Êtes-vous sûr de ne pas vouloir vous inscrire sur notre annuaire
              d'entreprises ?
            </h1>
            <p>
              Il permet à des candidats de vous trouver et de vous contacter
              selon vos préférences (nous n'affichons pas vos coordonnées sur
              notre site).
            </p>
            <p>L'immersion en entreprise vous permet de :</p>
            <ul>
              <li>
                <strong>faire connaître vos métiers</strong> et votre
                environnement de travail,
              </li>
              <li>
                <strong>évaluer des candidats</strong> potentiels en immersion
                professionnel,
              </li>
              <li>
                <strong>trouver des profils qui vous auraient échappés</strong>{" "}
                en cas de recrutement classique,
              </li>
              <li>
                <strong>renforcer une démarche inclusive</strong> au sein des
                équipes.
              </li>
            </ul>

            <Button
              className={fr.cx("fr-mt-4w", "fr-mb-5w")}
              iconId="fr-icon-arrow-right-line"
              linkProps={{
                href: `${
                  routes.formEstablishment({
                    siret: fetchedConvention?.siret,
                    bcEmail:
                      fetchedConvention?.signatories.establishmentRepresentative
                        .email,
                    bcFirstName:
                      fetchedConvention?.signatories.establishmentRepresentative
                        .firstName,
                    bcLastName:
                      fetchedConvention?.signatories.establishmentRepresentative
                        .lastName,
                    bcPhone:
                      fetchedConvention?.signatories.establishmentRepresentative
                        .phone,
                  }).href
                }`,
              }}
            >
              Je m'inscris en 2 minutes
            </Button>
          </div>
          <div className={fr.cx("fr-col-lg-6", "fr-mt-auto")}>
            <img src={formIntroIllustration} alt="" />
          </div>
        </section>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
