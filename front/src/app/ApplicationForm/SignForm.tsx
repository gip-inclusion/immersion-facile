import { Formik } from "formik";
import React, { useEffect, useState } from "react";
import { ApplicationFormFields } from "src/app/ApplicationForm/ApplicationFormFields";
import { immersionApplicationGateway } from "src/app/dependencies";
import { routes } from "src/app/routes";
import { toFormikValidationSchema } from "src/components/form/zodValidate";
import { MarianneHeader } from "src/components/MarianneHeader";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import {
  ImmersionApplicationDto,
  immersionApplicationSchema,
} from "src/shared/ImmersionApplicationDto";
import { Role } from "src/shared/tokens/MagicLinkPayload";
import { Route } from "type-route";
import { ApiDataContainer } from "../admin/ApiDataContainer";
import { SubmitFeedback, SuccessFeedbackKind } from "./SubmitFeedback";

type SignFormRoute = Route<typeof routes.immersionApplicationsToSign>;

interface SignFormProps {
  route: SignFormRoute;
}

const extractRoleAndName = (
  jwt: string,
  application: ImmersionApplicationDto,
): [Role, string] => {
  const payload = decodeJwt(jwt);
  const role = payload.role;
  const name =
    role === "beneficiary"
      ? `${application.lastName.toUpperCase()} ${application.firstName}`
      : `${application.mentor}`;
  return [role, name];
};

export const SignForm = ({ route }: SignFormProps) => {
  if (!route.params.jwt) {
    return <p>Lien non valide</p>;
  }

  return (
    <>
      <MarianneHeader />

      <ApiDataContainer
        callApi={() => immersionApplicationGateway.getML(route.params.jwt)}
        jwt={route.params.jwt}
      >
        {(response) => (
          <SignFormSpecific response={response} jwt={route.params.jwt} />
        )}
      </ApiDataContainer>
    </>
  );
};

type SignFormSpecificProps = {
  response: any;
  jwt: string;
};

const SignFormSpecific = ({ response, jwt }: SignFormSpecificProps) => {
  const [initialValues, setInitialValues] =
    useState<Partial<ImmersionApplicationDto> | null>(null);
  const [signeeName, setSigneeName] = useState<string | undefined>();
  const [signeeRole, setSigneeRole] = useState<Role | undefined>();
  const [alreadySigned, setAlreadySigned] = useState(false);

  const [submitFeedback, setSubmitFeedback] = useState<
    SuccessFeedbackKind | Error | null
  >(null);

  useEffect(() => {
    if (!response) return;
    const [role, name] = extractRoleAndName(jwt, response);
    setSigneeName(name);
    setSigneeRole(role);
    // Uncheck the checkbox.
    if (role === "beneficiary") {
      setAlreadySigned(response.beneficiaryAccepted);
    } else if (role === "establishment") {
      setAlreadySigned(response.enterpriseAccepted);
    }
    setInitialValues(response);
  }, [!!response]);

  if (!response) return <p>Chargement en cours...</p>;

  return (
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <div className="fr-col-lg-8 fr-p-2w">
        <h2>
          Formulaire pour conventionner une période de mise en situation
          professionnelle (PMSMP)
        </h2>

        <div className="fr-text">
          Voici la demande de convention que vous venez de compléter. <br />
          Relisez la bien et si cela vous convient, signez la avec le bouton "je
          signe cette demande" <br />
          <p className="fr-text--xs">
            Ce formulaire vaut équivalence du CERFA 13912 * 03
          </p>
        </div>

        {initialValues && (
          <>
            <Formik
              enableReinitialize={true}
              initialValues={initialValues}
              validationSchema={toFormikValidationSchema(
                immersionApplicationSchema,
              )}
              onSubmit={async (values, { setSubmitting, setErrors }) => {
                try {
                  // Confirm checkbox
                  const conditionsAccepted =
                    signeeRole === "beneficiary"
                      ? values.beneficiaryAccepted
                      : values.enterpriseAccepted;
                  if (!conditionsAccepted) {
                    setErrors({
                      beneficiaryAccepted:
                        signeeRole === "beneficiary"
                          ? "Engagement est obligatoire"
                          : undefined,
                      enterpriseAccepted:
                        signeeRole === "establishment"
                          ? "Engagement est obligatoire"
                          : undefined,
                    });
                    setSubmitting(false);
                    return;
                  }

                  await immersionApplicationGateway.signApplication(jwt);

                  setSubmitFeedback("signedSuccessfully");

                  setAlreadySigned(true);
                } catch (e: any) {
                  console.log(e);
                  setSubmitFeedback(e);
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              {(props) => {
                const rejectWithMessageForm = async (): Promise<void> => {
                  const justification = prompt(
                    "Précisez la raison et la modification nécessaire *",
                  );

                  if (justification === null) return;
                  if (justification === "")
                    return await rejectWithMessageForm();

                  try {
                    await immersionApplicationGateway.updateStatus(
                      { status: "DRAFT", justification },
                      jwt,
                    );
                    setSubmitFeedback("modificationsAsked");
                  } catch (e: any) {
                    console.log(e);
                    setSubmitFeedback(e);
                  }
                };

                return (
                  <div>
                    <form
                      onReset={props.handleReset}
                      onSubmit={props.handleSubmit}
                    >
                      <ApplicationFormFields
                        isFrozen={true}
                        isSignOnly={true}
                        isSignatureEnterprise={signeeRole === "establishment"}
                        signeeName={signeeName}
                        alreadySubmitted={alreadySigned}
                        onRejectForm={rejectWithMessageForm}
                      />

                      <SubmitFeedback submitFeedback={submitFeedback} />
                    </form>
                  </div>
                );
              }}
            </Formik>
          </>
        )}
        {!initialValues && <p>Loading</p>}
      </div>
    </div>
  );
};
