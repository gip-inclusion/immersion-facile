import { fr } from "@codegouvfr/react-dsfr";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { Card } from "@codegouvfr/react-dsfr/Card";
import Input from "@codegouvfr/react-dsfr/Input";
import Select, { type SelectProps } from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { renderContent } from "html-templates/src/components/email";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type DiscussionReadDto,
  type RejectDiscussionAndSendNotificationParam,
  type RejectionKind,
  type WithDiscussionRejection,
  discussionRejectionSchema,
  domElementIds,
  rejectDiscussionEmailParams,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";

export const RejectApplicationForm = ({
  discussion,
}: {
  discussion: DiscussionReadDto;
}): JSX.Element => {
  const { register, watch, handleSubmit, formState } =
    useForm<WithDiscussionRejection>({
      resolver: zodResolver(discussionRejectionSchema),
    });
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const getFieldError = makeFieldError(formState);
  const dispatch = useDispatch();
  const watchedFormValues = watch();
  const [rejectParams, setRejectParams] =
    useState<RejectDiscussionAndSendNotificationParam | null>(null);
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
  if (!inclusionConnectedJwt) throw new Error("No jwt found");
  if (rejectParams) {
    const { htmlContent, subject } = rejectDiscussionEmailParams(
      rejectParams,
      discussion,
    );
    return (
      <>
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
        <ButtonsGroup
          buttons={[
            {
              id: domElementIds.establishmentDashboard.discussion
                .rejectApplicationCancelButton,
              priority: "secondary",
              children: "Annuler",
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
                    status: "REJECTED",
                    feedbackTopic: "dashboard-discussion-rejection",
                    ...rejectParams,
                    jwt: inclusionConnectedJwt,
                  }),
                ),
            },
          ]}
          inlineLayoutWhen="always"
        />
      </>
    );
  }

  return (
    <form
      onSubmit={handleSubmit((values) =>
        setRejectParams({ ...values, discussionId: discussion.id }),
      )}
    >
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
      <ButtonsGroup
        buttons={[
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationCancelButton,
            priority: "secondary",
            children: "Annuler",
            type: "button",
          },
          {
            id: domElementIds.establishmentDashboard.discussion
              .rejectApplicationSubmitPreviewButton,
            priority: "primary",
            children: "Prévisualiser et envoyer",
          },
        ]}
        inlineLayoutWhen="always"
      />
    </form>
  );
};
