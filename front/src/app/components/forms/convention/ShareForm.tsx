import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  domElementIds,
  type InternshipKind,
  type ShareConventionByEmailDto,
  shareConventionByEmailSchema,
} from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

type ShareFormProps = {
  onSuccess: () => void;
  onError: () => void;
  conventionFormData: {
    internshipKind: InternshipKind;
  };
};

const makeInitialValues = ({
  internshipKind,
}: {
  internshipKind: InternshipKind;
}): ShareConventionByEmailDto => ({
  internshipKind,
  senderEmail: "",
});

export const ShareForm = ({
  conventionFormData,
  onSuccess,
  onError,
}: ShareFormProps) => {
  const [isOnlyForSelf, setIsOnlyForSelf] = useState(false);
  const onSubmit = async (values: ShareConventionByEmailDto) => {
    const result =
      await outOfReduxDependencies.conventionGateway.shareConventionLinkByEmail(
        values,
      );
    result ? onSuccess() : onError();
  };
  const methods = useForm<ShareConventionByEmailDto>({
    mode: "onTouched",
    defaultValues: makeInitialValues(conventionFormData),
    resolver: zodResolver(shareConventionByEmailSchema),
  });
  const { register, handleSubmit, formState, reset, setValue } = methods;

  useEffect(() => {
    reset(makeInitialValues(conventionFormData));
  }, [conventionFormData, reset]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id={domElementIds.conventionImmersionRoute.shareForm}
    >
      <p className={fr.cx("fr-text--xs")}>
        Tous les champs marqués d'une astérisque (*) sont obligatoires.
      </p>
      <Input
        label="Votre adresse email *"
        nativeInputProps={{
          ...register("senderEmail"),
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
          setValue("recipientEmail", "");
          setValue("details", "");
          setIsOnlyForSelf(checked);
        }}
      />
      <Input
        className={fr.cx("fr-mt-2w")}
        label={`Adresse email du destinataire ${isOnlyForSelf ? "(facultatif)" : "*"}`}
        nativeInputProps={{
          ...register("recipientEmail"),
          type: "email",
          placeholder: "nom@exemple.com",
        }}
        state={formState.errors.recipientEmail ? "error" : "default"}
        stateRelatedMessage={formState.errors.recipientEmail?.message}
        disabled={isOnlyForSelf}
      />
      <Input
        label="Votre message (facultatif)"
        nativeTextAreaProps={{ ...register("details") }}
        textArea
        state={formState.errors.details ? "error" : "default"}
        stateRelatedMessage={formState.errors.details?.message}
        disabled={isOnlyForSelf}
      />
      <Button
        type="submit"
        title="Envoyer le brouillon"
        disabled={!formState.isValid}
        id={domElementIds.conventionImmersionRoute.shareFormSubmitButton}
      >
        Envoyer
      </Button>
    </form>
  );
};
