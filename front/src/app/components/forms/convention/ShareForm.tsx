import { fr } from "@codegouvfr/react-dsfr";
import { Input } from "@codegouvfr/react-dsfr/Input";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  type ConventionPresentation,
  domElementIds,
  type ShareConventionDraftByEmailDto,
  shareConventionDraftByEmailSchema,
  toConventionDraftDto,
} from "shared";
import { Feedback } from "src/app/components/feedback/Feedback";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { conventionDraftSlice } from "src/core-logic/domain/convention/convention-draft/conventionDraft.slice";

type ShareFormProps = {
  conventionFormData: ConventionPresentation;
};

const makeInitialValues = ({
  conventionFormData,
}: {
  conventionFormData: ConventionPresentation;
}): ShareConventionDraftByEmailDto => ({
  senderEmail: "",
  conventionDraft: toConventionDraftDto({ convention: conventionFormData }),
});

export const ShareForm = ({ conventionFormData }: ShareFormProps) => {
  const dispatch = useDispatch();
  const [isOnlyForSelf, setIsOnlyForSelf] = useState(false);
  const onSubmit = (values: ShareConventionDraftByEmailDto) => {
    dispatch(
      conventionDraftSlice.actions.shareConventionDraftByEmailRequested({
        ...values,
        feedbackTopic: "convention-draft",
      }),
    );
  };
  const methods = useForm<ShareConventionDraftByEmailDto>({
    mode: "onTouched",
    defaultValues: makeInitialValues({ conventionFormData }),
    resolver: zodResolver(shareConventionDraftByEmailSchema),
  });
  const { register, handleSubmit, formState, reset, setValue } = methods;

  useEffect(() => {
    reset(makeInitialValues({ conventionFormData }));
  }, [conventionFormData, reset]);

  return (
    <WithFeedbackReplacer
      topic="convention-draft"
      renderFeedback={() => {
        return <Feedback topics={["convention-draft"]} />;
      }}
    >
      <form
        id={
          domElementIds.conventionImmersionRoute.shareConventionDraft.shareForm
        }
        onSubmit={handleSubmit(onSubmit)}
      >
        <p className={fr.cx("fr-text--xs")}>
          Tous les champs marqués d'une astérisque (*) sont obligatoires.
        </p>
        <Input
          label="Votre adresse email *"
          nativeInputProps={{
            ...register("senderEmail"),
            id: domElementIds.conventionImmersionRoute.shareConventionDraft
              .shareFormEmailInput,
            type: "email",
            placeholder: "nom@exemple.com",
          }}
          state={formState.errors.senderEmail ? "error" : "default"}
          stateRelatedMessage={formState.errors.senderEmail?.message}
        />
        <ToggleSwitch
          label="Je souhaite uniquement enregistrer un brouillon pour moi"
          checked={isOnlyForSelf}
          onChange={(checked) => {
            setValue(
              "recipientEmail" as keyof ShareConventionDraftByEmailDto,
              undefined,
            );
            setValue(
              "details" as keyof ShareConventionDraftByEmailDto,
              undefined,
            );
            setIsOnlyForSelf(checked);
          }}
        />
        <Input
          className={fr.cx("fr-mt-2w")}
          label={`Adresse email du destinataire ${isOnlyForSelf ? "(facultatif)" : "*"}`}
          nativeInputProps={{
            ...register("recipientEmail", {
              setValueAs: (v) => (v === "" ? undefined : v),
            }),
            type: "email",
            placeholder: "nom@exemple.com",
            id: domElementIds.conventionImmersionRoute.shareConventionDraft
              .shareFormRecipientEmailInput,
          }}
          state={formState.errors.recipientEmail ? "error" : "default"}
          stateRelatedMessage={formState.errors.recipientEmail?.message}
          disabled={isOnlyForSelf}
        />
        <Input
          label="Votre message (facultatif)"
          nativeTextAreaProps={{
            ...register("details", {
              setValueAs: (v) => (v === "" ? undefined : v),
            }),
            id: domElementIds.conventionImmersionRoute.shareConventionDraft
              .shareFormDetailsInput,
          }}
          textArea
          state={formState.errors.details ? "error" : "default"}
          stateRelatedMessage={formState.errors.details?.message}
          disabled={isOnlyForSelf}
        />
      </form>
    </WithFeedbackReplacer>
  );
};
