import { Formik } from "formik";
import { mergeDeepRight } from "ramda";
import React, { useEffect } from "react";
import { Notification } from "react-design-system/immersionFacile";
import { useDispatch } from "react-redux";
import {
  ConventionDto,
  ConventionMagicLinkPayload,
  conventionSchema,
  isSignatory,
  SignatoryRole,
  signatoryRoles,
} from "shared";
import { ConventionFeedbackNotification } from "src/app/components/ConventionFeedbackNotification";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import {
  conventionSelectors,
  signatoryDataFromConvention,
} from "src/core-logic/domain/convention/convention.selectors";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { useConvention } from "src/hooks/convention.hooks";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Route } from "type-route";
import { ConventionFormFields } from "./ConventionFields/ConventionFormFields";

type SignFormRoute = Route<typeof routes.conventionToSign>;

interface SignFormProps {
  route: SignFormRoute;
}

const extractRole = (jwt: string): SignatoryRole => {
  const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
  const role = payload.role;
  if (!isSignatory(role))
    throw new Error(
      `Only ${signatoryRoles.join(", ")} are allow to sign, received ${role}`,
    );
  return role;
};

export const ConventionSignPage = ({ route }: SignFormProps) => {
  if (!route.params.jwt) {
    return (
      <HeaderFooterLayout>
        <p>Lien non valide</p>;
      </HeaderFooterLayout>
    );
  }

  const payload = decodeJwt<ConventionMagicLinkPayload>(route.params.jwt);

  if (!signatoryRoles.includes(payload.role as SignatoryRole))
    return (
      <HeaderFooterLayout>
        <div className="p-5">
          <Notification title="Utilisateur incorrect" type="error">
            <p>
              Seul les signataires peuvent signer la convention. Le lien que
              vous avez utilisé ne vous permet pas de signer la convention.
            </p>
            <p>
              N'hésitez pas à nous contacter pour nous signaler comment ce lien
              vous est parvenu :{" "}
              <a href="mailto:contact@immersion-facile.beta.gouv.fr">
                contact@immersion-facile.beta.gouv.fr
              </a>
            </p>
          </Notification>
        </div>
      </HeaderFooterLayout>
    );

  return (
    <HeaderFooterLayout>
      <SignFormSpecific jwt={route.params.jwt} />
    </HeaderFooterLayout>
  );
};

type SignFormSpecificProps = {
  jwt: string;
};

const SignFormSpecific = ({ jwt }: SignFormSpecificProps) => {
  const { convention, fetchConventionError, submitFeedback, isLoading } =
    useConvention(jwt);

  const { signatory: currentSignatory } = useAppSelector(
    conventionSelectors.signatoryData,
  );
  const dispatch = useDispatch();

  useEffect(() => {
    const role = extractRole(jwt);
    dispatch(conventionSlice.actions.currentSignatoryRoleChanged(role));
  }, [jwt]);

  useExistingSiret(convention?.siret);

  if (!isLoading) return <p>Chargement en cours...</p>;
  if (!convention) return <p>Pas de convention correspondante trouvée...</p>;
  if (convention.status === "REJECTED") return <ConventionRejectedMessage />;
  if (convention.status === "DRAFT")
    return <ConventionNeedsModificationMessage jwt={jwt} />;

  const askFormModificationWithMessageForm = async (): Promise<void> => {
    const justification = prompt(
      "Précisez la raison et la modification nécessaire *",
    )?.trim();

    if (justification === null || justification === undefined) return;
    if (justification === "") return askFormModificationWithMessageForm();

    dispatch(
      conventionSlice.actions.statusChangeRequested({
        newStatus: "REJECTED",
        feedbackKind: "rejected",
        justification,
        jwt,
      }),
    );
  };

  if (fetchConventionError)
    return (
      <SignPageLayout>
        <Notification
          title="Erreur lors de la récupération de la convention"
          type="error"
        >
          {fetchConventionError}
        </Notification>
      </SignPageLayout>
    );

  return (
    <SignPageLayout>
      <h2>
        Formulaire pour conventionner une période de mise en situation
        professionnelle (PMSMP)
      </h2>

      <div className="fr-text">
        Voici la demande de convention que vous venez de compléter. <br />
        Relisez la bien et si cela vous convient, signez la avec le bouton "je
        signe cette demande"
        <p className="fr-text--xs fr-mt-1w">
          Ce formulaire vaut équivalence du CERFA 13912 * 04
        </p>
      </div>

      {!convention ? (
        <p>Chargement en cours...</p>
      ) : (
        <>
          <Formik
            enableReinitialize={true}
            initialValues={convention}
            validationSchema={toFormikValidationSchema(conventionSchema)}
            onSubmit={(values, { setErrors }) => {
              if (!currentSignatory) return;

              // Confirm checkbox
              const { signedAtFieldName, signatory } =
                signatoryDataFromConvention(
                  mergeDeepRight(
                    convention as ConventionDto,
                    values as ConventionDto,
                  ) as ConventionDto,
                  currentSignatory.role,
                );

              const conditionsAccepted = !!signatory?.signedAt;

              if (!conditionsAccepted) {
                setErrors({
                  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                  [signedAtFieldName!]: "La signature est obligatoire",
                });
                return;
              }

              dispatch(conventionSlice.actions.signConventionRequested(jwt));
            }}
          >
            {(props) => {
              if (Object.values(props.errors).length > 0) {
                // eslint-disable-next-line no-console
                console.log("Erros in form : ", props.errors);
              }

              return (
                <div>
                  <form
                    onReset={props.handleReset}
                    onSubmit={props.handleSubmit}
                  >
                    {currentSignatory && (
                      <ConventionFormFields
                        isFrozen={true}
                        isSignOnly={true}
                        signatory={currentSignatory}
                        onModificationsRequired={
                          askFormModificationWithMessageForm
                        }
                      />
                    )}
                    {Object.values(props.errors).length > 0 && (
                      <div style={{ color: "red" }}>
                        Veuillez corriger les champs erronés
                      </div>
                    )}

                    <ConventionFeedbackNotification
                      submitFeedback={submitFeedback}
                      signatories={props.values.signatories}
                    />
                  </form>
                </div>
              );
            }}
          </Formik>
        </>
      )}
    </SignPageLayout>
  );
};

const ConventionRejectedMessage = () => (
  <SignPageLayout>
    <Notification
      type="error"
      title="Désolé : votre demande d'immersion a été refusée"
    >
      <p className="fr-mt-1w">
        Votre demande d'immersion a été refusée. Vous avez reçu un mail vous en
        donnant les raisons.
      </p>
      <p>Veuillez contacter votre conseiller pour plus d'informations.</p>
    </Notification>
  </SignPageLayout>
);

const ConventionNeedsModificationMessage = (props: { jwt: string }) => (
  <SignPageLayout>
    <Notification
      type="info"
      title="Des modifications ont été demandées sur votre demande"
    >
      <p className="fr-mt-1w">
        Vous ne pouvez pas encore signer votre demande d'immersion car des
        modifications ont été réclamées par votre conseiller (Vous avez reçu un
        mail précisant les changements à effectuer).
      </p>

      <span className="block">
        <a {...routes.conventionImmersion({ jwt: props.jwt }).link}>
          Cliquez ici pour aller à la page d'édition
        </a>
      </span>
    </Notification>
  </SignPageLayout>
);

const SignPageLayout: React.FC = ({ children }) => (
  <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
    <div className="fr-col-lg-8 fr-p-2w">{children}</div>
  </div>
);
