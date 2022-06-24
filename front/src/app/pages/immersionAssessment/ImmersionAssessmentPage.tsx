import { CircularProgress } from "@mui/material";
import { Form, Formik } from "formik";
import { identity } from "ramda";
import React from "react";
import { ConventionReadDto } from "shared/src/convention/convention.dto";
import {
  AssessmentStatus,
  assessmentStatuses,
  ImmersionAssessmentDto,
} from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { immersionAssessmentSchema } from "shared/src/immersionAssessment/immersionAssessmentSchema";
import { ConventionMagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import { RadioGroupForField } from "src/app/components/RadioGroup";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";
import { decodeJwt } from "src/core-logic/adapters/decodeJwt";
import {
  immersionAssessmentErrorSelector,
  immersionAssessmentStatusSelector,
} from "src/core-logic/domain/immersionAssessment/immersionAssessment.selectors";
import { conventionSelectors } from "src/core-logic/domain/convention/convention.selectors";
import { TextInput } from "src/uiComponents/form/TextInput";
import { toFormikValidationSchema } from "src/uiComponents/form/zodValidate";
import { Route } from "type-route";
import { useConvention } from "src/hooks/convention";
import { useImmersionAssessment } from "src/hooks/immersionAssessment";
import {
  Button,
  Title,
  Notification,
} from "react-design-system/immersionFacile";
import { toDisplayedDate } from "shared/src/utils/date";

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
  } = useAppSelector(conventionSelectors.conventionState);
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
    <HeaderFooterLayout>
      <Title>
        Bilan de l'immersion{" "}
        {convention ? `de ${convention.firstName} ${convention.lastName}` : ""}
      </Title>
      {isLoading && <CircularProgress />}
      {conventionFetchError && <div>{conventionFetchError}</div>}
      {convention && !canCreateAssessment && (
        <Notification
          type="error"
          title="Votre convention n'est pas prête à recevoir un bilan"
        >
          Seule une convention entièrement validée peut recevoir un bilan
        </Notification>
      )}
      {canCreateAssessment && (
        <div className="px-2 md:pl-20">
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
                <div className="flex flex-col">
                  <RadioGroupForField
                    label=""
                    name={getName("status")}
                    options={assessmentStatuses.map((value) => ({
                      value,
                      label: labels[value],
                    }))}
                  />
                  <div style={{ minWidth: "20rem", maxWidth: "34rem" }}>
                    <TextInput
                      multiline={true}
                      label="Comment s'est passée l'immersion ?"
                      name={getName("establishmentFeedback")}
                    />
                  </div>
                  <Button
                    className="w-28"
                    type="submit"
                    disable={
                      assessmentStatus !== "Idle" || assessmentError !== null
                    }
                  >
                    Envoyer
                  </Button>
                  {assessmentError && (
                    <Notification type="error" title="Erreur">
                      {assessmentError}
                    </Notification>
                  )}
                  {assessmentStatus === "Success" && (
                    <Notification type="success" title={"Bilan envoyé"}>
                      Le bilan a bien été envoyé au conseiller
                    </Notification>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      )}
    </HeaderFooterLayout>
  );
};

const ImmersionDescription = ({
  convention,
}: {
  convention: ConventionReadDto;
}) => (
  <p>
    L'immersion de{" "}
    <Bold>
      {convention.firstName} {convention.lastName}
    </Bold>{" "}
    auprès de l'établissement <Bold>{convention.businessName}</Bold> qui a eu
    lieu du <Bold>{toDisplayedDate(new Date(convention.dateStart))} </Bold>au{" "}
    <Bold>{toDisplayedDate(new Date(convention.dateEnd))}</Bold> touche à sa
    fin.
  </p>
);

const Bold: React.FC = ({ children }) => (
  <span className="font-bold">{children}</span>
);

const getName = (name: keyof ImmersionAssessmentDto) => name;
const labels: Record<AssessmentStatus, string> = {
  FINISHED: "Le bénéficiaire a suivi son immersion jusqu'à la fin",
  ABANDONED: "Le bénéficiaire a abandonné l'immersion",
};
