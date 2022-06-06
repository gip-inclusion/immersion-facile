import { CircularProgress } from "@mui/material";
import { Form, Formik } from "formik";
import { identity } from "ramda";
import React from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import {
  AssessmentStatus,
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { immersionAssessmentSchema } from "shared/src/immersionAssessment/immersionAssessmentSchema";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { RadioGroupForField } from "src/app/components/RadioGroup";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import {
  immersionAssessmentErrorSelector,
  immersionAssessmentStatusSelector,
} from "src/core-logic/domain/immersionAssessment/immersionAssessment.selectors";
import { conventionStateSelector } from "src/core-logic/domain/convention/convention.selectors";
import { Button } from "src/uiComponents/Button";
import { ErrorMessage } from "src/uiComponents/form/ErrorMessage";
import { SuccessMessage } from "src/uiComponents/form/SuccessMessage";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Title } from "src/uiComponents/Title";
import { Route } from "type-route";
import { useConvention } from "src/hooks/convention";
import { useImmersionAssessment } from "src/hooks/immersionAssessment";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentProps {
  route: ImmersionAssessmentRoute;
}

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentProps) => {
  useConvention(route.params.jwt);
  const { role } = decodeJwt<ConventionMagicLinkPayload>(route.params.jwt);
  const { createAssessment } = useImmersionAssessment(route.params.jwt);
  const {
    convention,
    isLoading,
    error: conventionFetchError,
  } = useAppSelector(conventionStateSelector);
  const assessmentError = useAppSelector(immersionAssessmentErrorSelector);
  const assessmentStatus = useAppSelector(immersionAssessmentStatusSelector);

  if (role !== "establishment") {
    return (
      <div className="pt-4 flex items-center justify-center">
        <p className="text-2xl">
          Vous n'êtes pas autorisé a accéder à cette page
        </p>
      </div>
    );
  }

  const canCreateAssessment =
    convention?.status === "ACCEPTED_BY_VALIDATOR" ||
    convention?.status === "VALIDATED";

  return (
    <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
      <div className="fr-col-lg-8 fr-p-2w">
        <Title>Bilan de l'immersion</Title>
        {isLoading && <CircularProgress />}
        {conventionFetchError && <div>{conventionFetchError}</div>}
        {convention && !canCreateAssessment && (
          <ErrorMessage title="Votre convention n'est pas prête à recevoir un bilan">
            Seule une convention entièrement validée peut recevoir un bilan
          </ErrorMessage>
        )}
        {canCreateAssessment && (
          <div className="">
            <ImmersionDescription convention={convention} />
            <Formik
              initialValues={identity<ImmersionAssessmentDto>({
                conventionId: convention.id,
                status: null as unknown as AssessmentStatus,
                establishmentFeedback: "",
              })}
              validationSchema={toFormikValidationSchema(
                immersionAssessmentSchema,
              )}
              onSubmit={createAssessment}
            >
              {() => (
                <Form>
                  <div className="flex flex-col m-auto items-center">
                    <div className="flex items-center justify-between flex-wrap">
                      <RadioGroupForField
                        label=""
                        name={getName("status")}
                        options={assessmentStatuses.map((value) => ({
                          value,
                          label: labels[value],
                        }))}
                      />
                      <div
                        className="flex-1 pl-4"
                        style={{ minWidth: "20rem", maxWidth: "34rem" }}
                      >
                        <TextInput
                          multiline={true}
                          label="Comment s'est passé l'immersion ?"
                          name={getName("establishmentFeedback")}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-40"
                      type="submit"
                      disable={
                        assessmentStatus !== "Idle" || assessmentError !== null
                      }
                    >
                      Envoyer
                    </Button>
                    {assessmentError && (
                      <ErrorMessage title="Erreur">
                        {assessmentError}
                      </ErrorMessage>
                    )}
                    {assessmentStatus === "Success" && (
                      <SuccessMessage title={"Bilan envoyé"}>
                        Le bilan a bien été envoyé au conseiller
                      </SuccessMessage>
                    )}
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}
      </div>
    </div>
  );
};

const ImmersionDescription = ({
  convention,
}: {
  convention: ConventionDto;
}) => (
  <div>
    <p>
      L'immersion de{" "}
      <Bold>
        {convention.firstName} {convention.lastName}
      </Bold>{" "}
      auprès de l'établissement <Bold>{convention.businessName}</Bold> qui a eu
      lieu du <Bold>{convention.dateStart} </Bold>au{" "}
      <Bold>{convention.dateEnd}</Bold> touche à sa fin.
    </p>
  </div>
);

const Bold: React.FC = ({ children }) => (
  <span className="font-bold">{children}</span>
);

const getName = (name: keyof ImmersionAssessmentDto) => name;
const labels: Record<AssessmentStatus, string> = {
  ABANDONED: "Le bénéficiaire a abandonné l'immersion",
  FINISHED: "Le bénéficiaire a suivi son immersion jusqu'à la fin",
};
