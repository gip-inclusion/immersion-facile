import { fr } from "@codegouvfr/react-dsfr";
import Input from "@codegouvfr/react-dsfr/Input";
import { createModal } from "@codegouvfr/react-dsfr/Modal";
import RadioButtons, {
  type RadioButtonsProps,
} from "@codegouvfr/react-dsfr/RadioButtons";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type CandidateWarnedMethod,
  type DiscussionReadDto,
  type WithDiscussionStatusAccepted,
  candidateWarnedMethods,
  discussionAcceptedSchema,
  domElementIds,
} from "shared";
import { booleanSelectOptions } from "src/app/contents/forms/common/values";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { discussionSlice } from "src/core-logic/domain/discussion/discussion.slice";

const modal = createModal({
  isOpenedByDefault: false,
  id: domElementIds.establishmentDashboard.discussion.acceptApplicationModal,
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

export const openAcceptApplicationModal = () => modal.open();

export const AcceptApplicationModal = ({
  discussion,
}: {
  discussion: DiscussionReadDto;
}): JSX.Element => {
  const { register, watch, handleSubmit, formState, setValue } =
    useForm<WithDiscussionStatusAccepted>({
      resolver: zodResolver(discussionAcceptedSchema),
      defaultValues: { status: "ACCEPTED", candidateWarnedMethod: null },
    });
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const getFieldError = makeFieldError(formState);
  const dispatch = useDispatch();
  const watchedFormValues = watch();

  const [wasConventionEstablished, setWasConventionEstablished] =
    useState<boolean>();

  if (!inclusionConnectedJwt) throw new Error("No jwt found");

  const onSubmit = (values: WithDiscussionStatusAccepted) => {
    modal.close();
    return dispatch(
      discussionSlice.actions.updateDiscussionStatusRequested({
        feedbackTopic: "dashboard-discussion-status-updated",
        status: "ACCEPTED",
        candidateWarnedMethod: values.candidateWarnedMethod,
        conventionId: values.conventionId?.trim().toLowerCase() || undefined,
        discussionId: discussion.id,
        jwt: inclusionConnectedJwt,
      }),
    );
  };

  return (
    <modal.Component
      title={"Marquer comme acceptée"}
      buttons={[
        {
          id: domElementIds.establishmentDashboard.discussion
            .acceptApplicationCancelButton,
          priority: "secondary",
          type: "button",
          children: "Annuler",
          onClick: () => modal.close(),
        },
        {
          id: domElementIds.establishmentDashboard.discussion
            .acceptApplicationSubmitButton,
          priority: "primary",
          type: "submit",
          nativeButtonProps: {
            form: domElementIds.establishmentDashboard.discussion
              .acceptApplicationForm,
          },
          doClosesModal: false,
          children: "Marquer comme acceptée",
        },
      ]}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        id={
          domElementIds.establishmentDashboard.discussion.acceptApplicationForm
        }
      >
        <RadioButtons
          legend="Avez-vous déjà réalisé la convention pour cette candidature ? *"
          name="wasConventionEstablished"
          options={booleanSelectOptions.map((option) => ({
            ...option,
            nativeInputProps: {
              ...option.nativeInputProps,
              checked:
                Boolean(option.nativeInputProps.value) ===
                wasConventionEstablished,
              onChange: () => {
                setWasConventionEstablished(
                  option.nativeInputProps.value === 1,
                );
                if (option.nativeInputProps.value === 0) {
                  setValue("conventionId", undefined);
                }
              },
            },
          }))}
          orientation="vertical"
        />

        {wasConventionEstablished === false && (
          <RadioButtons
            legend="Comment avez-vous informé le candidat que sa candidature était acceptée ? *"
            name="candidateWarnedMethod"
            options={candidateWarnedMethod.map((option) => ({
              ...option,
              nativeInputProps: {
                ...option.nativeInputProps,
                checked:
                  option.nativeInputProps.value ===
                  watchedFormValues.candidateWarnedMethod,
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

        {wasConventionEstablished === true && (
          <div className={fr.cx("fr-mb-2w")}>
            <p>
              Si c'était une convention Immersion Facilitée, indiquez si
              possible l'ID de cette convention.
            </p>
            <Input
              label="ID de convention (optionnel)"
              nativeInputProps={{
                id: domElementIds.establishmentDashboard.discussion
                  .acceptApplicationConventionIdInput,
                ...register("conventionId"),
              }}
              {...getFieldError("conventionId")}
            />
          </div>
        )}
      </form>
    </modal.Component>
  );
};
