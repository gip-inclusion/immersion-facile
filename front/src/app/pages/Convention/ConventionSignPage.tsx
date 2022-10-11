import { Formik } from "formik";
import { mergeDeepRight } from "ramda";
import React, { useEffect, useState } from "react";
import { Notification } from "react-design-system/immersionFacile";
import {
  ConventionDto,
  ConventionField,
  ConventionMagicLinkPayload,
  ConventionReadDto,
  conventionSchema,
  exhaustiveCheck,
  getConventionFieldName,
  isSignatory,
  Signatory,
  SignatoryRole,
  signatoryRoles,
} from "shared";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { ApiDataContainer } from "src/app/pages/admin/ApiDataContainer";
import { routes } from "src/app/routing/routes";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Route } from "type-route";
import { ConventionFormFields } from "./ConventionFields/ConventionFormFields";
import { conventionGateway } from "src/app/config/dependencies";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { ConventionSubmitFeedbackNotification } from "src/app/components/ConventionSubmitFeedbackNotification";
import { useConventionSubmitFeedback } from "src/app/pages/Convention/useConventionSubmitFeedback";

type SignFormRoute = Route<typeof routes.conventionToSign>;

interface SignFormProps {
  route: SignFormRoute;
}

const toDisplayedName = (signatory: Signatory) =>
  `${signatory.lastName.toUpperCase()} ${signatory.firstName}`;

const fromSignatoryRole = (
  convention: ConventionDto,
  signatoryRole: SignatoryRole,
): {
  displayedName: string;
  signatory: Signatory;
  signedAtFieldName: ConventionField;
  signedAt: string | undefined;
} => {
  switch (signatoryRole) {
    case "beneficiary":
      return {
        displayedName: toDisplayedName(convention.signatories.beneficiary),
        signatory: convention.signatories.beneficiary,
        signedAtFieldName: getConventionFieldName(
          "signatories.beneficiary.signedAt",
        ),
        signedAt: convention.signatories.beneficiary.signedAt,
      };
    case "establishment":
    case "establishment-representative":
      return {
        displayedName: toDisplayedName(
          convention.signatories.establishmentRepresentative,
        ),
        signatory: convention.signatories.establishmentRepresentative,
        signedAtFieldName: getConventionFieldName(
          "signatories.establishmentRepresentative.email",
        ),
        signedAt: convention.signatories.establishmentRepresentative.signedAt,
      };
    case "legal-representative":
    case "beneficiary-representative":
      if (!convention.signatories.beneficiaryRepresentative)
        throw new Error("No beneficiary representative for this convention. ");
      return {
        displayedName: toDisplayedName(
          convention.signatories.beneficiaryRepresentative,
        ),
        signatory: convention.signatories.beneficiaryRepresentative,
        signedAtFieldName: getConventionFieldName(
          "signatories.beneficiaryRepresentative.email",
        ),
        signedAt: convention.signatories.beneficiaryRepresentative.signedAt,
      };
    default:
      return exhaustiveCheck(signatoryRole);
  }
};

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
              Seul le bénéficiaire ou le responsable d'entreprise peuvent signer
              la convention. Le lien que vous avez utilisé n'est destiné ni à un
              bénéficiaire ni à un tuteur.
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
      <ApiDataContainer
        callApi={() => conventionGateway.getMagicLink(route.params.jwt)}
        jwt={route.params.jwt}
      >
        {(convention) => (
          <SignFormSpecific convention={convention} jwt={route.params.jwt} />
        )}
      </ApiDataContainer>
    </HeaderFooterLayout>
  );
};

type SignFormSpecificProps = {
  convention: ConventionReadDto | null;
  jwt: string;
};

const SignFormSpecific = ({ convention, jwt }: SignFormSpecificProps) => {
  const { submitFeedback, setSubmitFeedback } = useConventionSubmitFeedback();

  useExistingSiret(convention?.siret);
  const [initialValues, setInitialValues] = useState<ConventionReadDto | null>(
    null,
  );
  const [signatory, setSignatory] = useState<Signatory | undefined>();
  const [currentSignatoryRole, setCurrentSignatoryRole] = useState<
    SignatoryRole | undefined
  >();

  useEffect(() => {
    if (!convention) return;
    const role = extractRole(jwt);
    setCurrentSignatoryRole(role);
    const { signatory } = fromSignatoryRole(convention, role);
    setSignatory(signatory);
    setInitialValues(convention);
  }, [!!convention]);

  if (!convention) return <p>Chargement en cours...</p>;

  if (convention.status === "REJECTED") return <ConventionRejectedMessage />;
  if (convention.status === "DRAFT")
    return <ConventionNeedsModificationMessage jwt={jwt} />;

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

      {initialValues && (
        <>
          <Formik
            enableReinitialize={true}
            initialValues={initialValues}
            validationSchema={toFormikValidationSchema(conventionSchema)}
            onSubmit={async (values, { setSubmitting, setErrors }) => {
              try {
                // Confirm checkbox
                const { signedAtFieldName, signedAt, signatory } =
                  fromSignatoryRole(
                    mergeDeepRight(
                      convention as ConventionDto,
                      values as ConventionDto,
                    ) as ConventionDto,
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    currentSignatoryRole!,
                  );

                const conditionsAccepted = !!signedAt;

                if (!conditionsAccepted) {
                  setErrors({
                    [signedAtFieldName]: "La signature est obligatoire",
                  });
                  setSubmitting(false);
                  return;
                }

                await conventionGateway.signApplication(jwt);

                setSignatory(signatory);
                setSubmitFeedback("signedSuccessfully");
              } catch (error: any) {
                //eslint-disable-next-line no-console
                console.log("onSubmitError", error);
                setSubmitFeedback(error);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {(props) => {
              if (Object.values(props.errors).length > 0) {
                // eslint-disable-next-line no-console
                console.log("Erros in form : ", props.errors);
              }

              const rejectWithMessageForm = async (): Promise<void> => {
                const justification = prompt(
                  "Précisez la raison et la modification nécessaire *",
                )?.trim();

                if (justification === null || justification === undefined)
                  return;
                if (justification === "") return rejectWithMessageForm();

                try {
                  await conventionGateway.updateStatus(
                    { status: "DRAFT", justification },
                    jwt,
                  );
                  setSubmitFeedback("modificationsAsked");
                } catch (e: any) {
                  //eslint-disable-next-line no-console
                  console.log("updateStatus Error", e);
                  setSubmitFeedback(e);
                }
              };

              return (
                <div>
                  <form
                    onReset={props.handleReset}
                    onSubmit={props.handleSubmit}
                  >
                    {signatory && (
                      <ConventionFormFields
                        isFrozen={true}
                        isSignOnly={true}
                        signatory={signatory}
                        onRejectForm={rejectWithMessageForm}
                      />
                    )}
                    {Object.values(props.errors).length > 0 && (
                      <div style={{ color: "red" }}>
                        Veuillez corriger les champs erronés
                      </div>
                    )}

                    <ConventionSubmitFeedbackNotification
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
      {!initialValues && <p>Loading</p>}
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
