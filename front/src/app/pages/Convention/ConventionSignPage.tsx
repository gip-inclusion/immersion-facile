import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { Notification } from "react-design-system/immersionFacile";
import {
  getConventionFieldName,
  isSignatory,
} from "shared/src/convention/convention";
import {
  ConventionReadDto,
  Signatory,
  SignatoryRole,
  signatoryRoles,
} from "shared/src/convention/convention.dto";
import { conventionSchema } from "shared/src/convention/convention.schema";
import {
  ConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { exhaustiveCheck } from "shared/src/utils";
import {
  SubmitFeedback,
  SuccessFeedbackKind,
} from "src/app/components/SubmitFeedback";
import { conventionGateway } from "src/app/config/dependencies";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { ApiDataContainer } from "src/app/pages/admin/ApiDataContainer";
import { routes } from "src/app/routing/routes";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import { useExistingSiret } from "src/hooks/siret.hooks";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Route } from "type-route";
import { ConventionFormFields } from "./ConventionFields/ConventionFormFields";

type SignFormRoute = Route<typeof routes.conventionToSign>;

interface SignFormProps {
  route: SignFormRoute;
}

const toDisplayedName = (signatory: Signatory<any>) =>
  `${signatory.lastName.toUpperCase()} ${signatory.firstName}`;

const getNameFromRole = (
  convention: ConventionReadDto,
  role: SignatoryRole,
): string => {
  switch (role) {
    case "beneficiary":
      return toDisplayedName(convention.signatories.beneficiary);
    case "establishment":
      return toDisplayedName(convention.signatories.mentor);
    default:
      return exhaustiveCheck(role);
  }
};

const extractRoleAndName = (
  jwt: string,
  convention: ConventionReadDto,
): [SignatoryRole, string] => {
  const payload = decodeJwt<ConventionMagicLinkPayload>(jwt);
  const role = payload.role;
  if (!isSignatory(role))
    throw new Error(
      `Only ${signatoryRoles.join(", ")} are allow to sign, received ${role}`,
    );
  const name = getNameFromRole(convention, role);
  return [role, name];
};

const signeeAllowRoles: Role[] = ["beneficiary", "establishment"];

export const ConventionSignPage = ({ route }: SignFormProps) => {
  if (!route.params.jwt) {
    return (
      <HeaderFooterLayout>
        <p>Lien non valide</p>;
      </HeaderFooterLayout>
    );
  }

  const payload = decodeJwt<ConventionMagicLinkPayload>(route.params.jwt);

  if (!signeeAllowRoles.includes(payload.role))
    return (
      <HeaderFooterLayout>
        <div className="p-5">
          <Notification title="Utilisateur incorrect" type="error">
            Seul le bénéficiaire ou le mentor peuvent signer la convention. Le
            lien que vous avez utilisé n'est destiné ni à un bénéficiaire ni à
            un tuteur.
            <br />
            <br />
            N'hésitez pas à nous contacter pour nous signaler comment ce lien
            vous est parvenu :{" "}
            <a href="mailto:contact@immersion-facile.beta.gouv.fr">
              contact@immersion-facile.beta.gouv.fr
            </a>
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
  useExistingSiret(convention?.siret);
  const [initialValues, setInitialValues] =
    useState<Partial<ConventionReadDto> | null>(null);
  const [signeeName, setSigneeName] = useState<string | undefined>();
  const [signeeRole, setSigneeRole] = useState<SignatoryRole | undefined>();
  const [alreadySigned, setAlreadySigned] = useState(false);

  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
  >(null);

  useEffect(() => {
    if (!convention) return;
    const [role, name] = extractRoleAndName(jwt, convention);
    setSigneeName(name);
    setSigneeRole(role);
    // Uncheck the checkbox.
    if (role === "beneficiary") {
      setAlreadySigned(!!convention.signatories.beneficiary.signedAt);
    } else if (role === "establishment") {
      setAlreadySigned(!!convention.signatories.mentor.signedAt);
    }
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
        signe cette demande" <br />
        <p className="fr-text--xs">
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
                const conditionsAccepted =
                  signeeRole === "beneficiary"
                    ? !!values?.signatories?.beneficiary?.signedAt
                    : !!values?.signatories?.mentor?.signedAt;

                if (!conditionsAccepted) {
                  setErrors({
                    [getConventionFieldName(
                      "signatories.beneficiary.signedAt",
                    )]:
                      signeeRole === "beneficiary"
                        ? "La signature est obligatoire"
                        : undefined,
                    [getConventionFieldName(
                      "signatories.beneficiary.signedAt",
                    )]:
                      signeeRole === "establishment"
                        ? "La signature est obligatoire"
                        : undefined,
                  });
                  setSubmitting(false);
                  return;
                }

                await conventionGateway.signApplication(jwt);

                setSubmitFeedback("signedSuccessfully");

                setAlreadySigned(true);
              } catch (e: any) {
                //eslint-disable-next-line no-console
                console.log("onSubmitError", e);
                setSubmitFeedback(e);
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
                    <ConventionFormFields
                      isFrozen={true}
                      isSignOnly={true}
                      isSignatureEnterprise={signeeRole === "establishment"}
                      signeeName={signeeName}
                      alreadySigned={alreadySigned}
                      onRejectForm={rejectWithMessageForm}
                    />
                    {Object.values(props.errors).length > 0 && (
                      <div style={{ color: "red" }}>
                        Veuillez corriger les champs erronés
                      </div>
                    )}

                    <SubmitFeedback submitFeedback={submitFeedback} />
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
    <br />
    <Notification
      type="error"
      title="Désolé : votre demande d'immersion a été refusée"
    >
      Votre demande d'immersion a été refusée. Vous avez reçu un mail vous en
      donnant les raisons.
      <p>Veuillez contacter votre conseiller pour plus d'informations.</p>
    </Notification>
  </SignPageLayout>
);

const ConventionNeedsModificationMessage = (props: { jwt: string }) => (
  <SignPageLayout>
    <br />
    <Notification
      type="info"
      title="Des modifications ont été demandées sur votre demande"
    >
      Vous ne pouvez pas encore signer votre demande d'immersion car des
      modifications ont été réclamées par votre conseiller (Vous avez reçu un
      mail précisant les changements à effectuer).
      <span className="block">
        <a {...routes.convention({ jwt: props.jwt }).link}>
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
