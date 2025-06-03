import { fr } from "@codegouvfr/react-dsfr";
import { Card } from "@codegouvfr/react-dsfr/Card";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import Select, { type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { renderContent } from "html-templates/src/components/email";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type CandidateWarnedMethod,
  type DiscussionReadDto,
  type RejectionCandidateAlreadyWarned,
  type RejectionKind,
  type WithDiscussionId,
  type WithDiscussionRejection,
  type WithDiscussionStatusRejected,
  candidateWarnedMethods,
  discussionRejectionSchema,
  domElementIds,
  rejectDiscussionEmailParams,
} from "shared";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";

const modal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.establishmentDashboard.discussion.rejectApplicationModal,
});

const labelByCandidateWarnedMethod: Record<CandidateWarnedMethod, string> = {
  email: "Par email",
  phone: "Par téléphone",
  inPerson: "En personne",
  other: "Autre",
};

const candidateWarnedMethod: RadioButtonsProps["options"] =
  candidateWarnedMethods.map((method) => ({
    label: labelByCandidateWarnedMethod[method],
    nativeInputProps: {
      value: method,
    },
  }));

const rejectionKindOptions: SelectProps.Option<RejectionKind>[] = [
  {
    label:
      "Je ne suis pas en capacité d'aider le candidat dans son projet professionnel",
    value: "UNABLE_TO_HELP",
  },
  {
    label:
      "Je traverse une période chargée et je n'ai pas le temps d'accueillir une immersion",
    value: "NO_TIME",
  },
  {
    label: "Autre",
    value: "OTHER",
  },
];

export const openRejectApplicationModal = () => modal.open();

export const RejectApplicationModal = ({
  discussion,
}: {
  discussion: DiscussionReadDto;
}): JSX.Element => {
  const { register, watch, handleSubmit, formState, setValue } =
    useForm<WithDiscussionRejection>({
      resolver: zodResolver(discussionRejectionSchema),
    });
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const getFieldError = makeFieldError(formState);
  const dispatch = useDispatch();
  const watchedFormValues = watch();

  const [rejectParams, setRejectParams] = useState<
    (WithDiscussionStatusRejected & WithDiscussionId) | null
  >(null);

  const [isCandidateWarned, setIsCandidateWarned] = useState<boolean>();

  if (!inclusionConnectedJwt) throw new Error("No jwt found");

  const onSubmit = (values: WithDiscussionRejection) => {
    if (values.rejectionKind === "CANDIDATE_ALREADY_WARNED")
      return dispatch(
        discussionSlice.actions.updateDiscussionStatusRequested({
          feedbackTopic: "dashboard-discussion-status-updated",
          status: "REJECTED",
          rejectionKind: "CANDIDATE_ALREADY_WARNED",
          candidateWarnedMethod: values.candidateWarnedMethod,
          discussionId: discussion.id,
          jwt: inclusionConnectedJwt,
        }),
      );

    return setRejectParams({
      ...values,
      status: "REJECTED",
      discussionId: discussion.id,
    });
  };

  const modalTitle = "Marquer comme refusée";

  if (rejectParams) {
    const { htmlContent, subject } = rejectDiscussionEmailParams(
      rejectParams,
      discussion,
    );

    return (
      <modal.Component
        title={modalTitle}
        buttons={[
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationCancelButton,
            priority: "secondary",
            children: "Précédent",
            doClosesModal: false,
            type: "button",
            onClick: () => setRejectParams(null),
          },
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationSubmitButton,
            priority: "primary",
            children: "Rejeter la candidature et notifier le candidat",
            onClick: () =>
              dispatch(
                discussionSlice.actions.updateDiscussionStatusRequested({
                  feedbackTopic: "dashboard-discussion-status-updated",
                  ...rejectParams,
                  jwt: inclusionConnectedJwt,
                }),
              ),
          },
        ]}
      >
        <p>
          Voici l'email qui sera envoyé au candidat si vous rejetez sa
          candidature :
        </p>
        <Card
          title={`Sujet : ${subject}`}
          className={fr.cx("fr-mb-2w")}
          desc={
            <div
              dangerouslySetInnerHTML={{
                __html:
                  renderContent(htmlContent, { wrapInTable: false }) ?? "",
              }}
            />
          }
        />
      </modal.Component>
    );
  }

  return (
    <modal.Component
      title={modalTitle}
      buttons={[
        {
          id: domElementIds.establishmentDashboard.discussion
            .rejectApplicationSubmitPreviewButton,
          priority: "primary",
          type: "submit",
          nativeButtonProps: {
            form: domElementIds.establishmentDashboard.discussion
              .rejectApplicationForm,
          },
          doClosesModal: false,
          children:
            watchedFormValues.rejectionKind === "CANDIDATE_ALREADY_WARNED"
              ? "Rejeter la candidature"
              : "Prévisualiser et envoyer",
        },
      ]}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        id={
          domElementIds.establishmentDashboard.discussion.rejectApplicationForm
        }
      >
        <RadioButtons
          legend="Avez-vous informé le candidat de ce refus ? *"
          name="isCandidateInformed"
          options={booleanSelectOptions.map((option) => ({
            ...option,
            nativeInputProps: {
              ...option.nativeInputProps,
              checked:
                Boolean(option.nativeInputProps.value) === isCandidateWarned,
              onChange: () => {
                setIsCandidateWarned(option.nativeInputProps.value === 1);
                setValue("rejectionKind", "CANDIDATE_ALREADY_WARNED");
              },
            },
          }))}
          orientation="vertical"
        />

        {isCandidateWarned === true && (
          <RadioButtons
            legend="Comment l'avez-vous informé ? *"
            name="candidateWarnedMethod"
            options={candidateWarnedMethod.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                checked:
                  option.nativeInputProps.value ===
                  (watchedFormValues as RejectionCandidateAlreadyWarned)
                    .candidateWarnedMethod,
                onChange: () => {
                  setValue(
                    "candidateWarnedMethod",
                    option.nativeInputProps.value as CandidateWarnedMethod,
                  );
                },
              },
            }))}
            orientation="vertical"
          />
        )}

        {isCandidateWarned === false && (
          <div className={fr.cx("fr-mb-2w")}>
            <Select
              label="Pour quel motif souhaitez-vous refuser cette candidature ?"
              nativeSelectProps={{
                id: domElementIds.establishmentDashboard.discussion
                  .rejectApplicationJustificationKindInput,
                ...register("rejectionKind"),
              }}
              options={rejectionKindOptions}
              {...getFieldError("rejectionKind")}
            />
            {watchedFormValues.rejectionKind === "OTHER" && (
              <Input
                textArea
                label="Précisez"
                nativeTextAreaProps={{
                  id: domElementIds.establishmentDashboard.discussion
                    .rejectApplicationJustificationReasonInput,
                  ...register("rejectionReason"),
                }}
                {...getFieldError("rejectionReason")}
              />
            )}
          </div>
        )}
      </form>
    </modal.Component>
  );
};
