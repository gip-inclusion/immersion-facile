import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  domElementIds,
  type InternshipKind,
  type ShareLinkByEmailDto,
  shareLinkByEmailSchema,
} from "shared";
import { outOfReduxDependencies } from "src/config/dependencies";

type ShareFormProps = {
  onSuccess: () => void;
  onError: () => void;
  conventionFormData: {
    internshipKind: InternshipKind;
    establishmentRepresentativeEmail: string;
    firstName: string;
    lastName: string;
  };
};

const makeInitialValues = ({
  firstName,
  lastName,
  establishmentRepresentativeEmail,
  link,
  internshipKind,
}: {
  firstName: string;
  lastName: string;
  establishmentRepresentativeEmail: string;
  link: string;
  internshipKind: InternshipKind;
}): Required<ShareLinkByEmailDto> => ({
  internshipKind,
  email: establishmentRepresentativeEmail,
  conventionLink: link,
  details: `${firstName || "Prénom"} ${
    lastName || "Nom"
  } vous invite à prendre connaissance de cette demande de convention d’immersion déjà partiellement remplie afin que vous la complétiez.  Merci !`,
});

export const ShareForm = ({
  conventionFormData,
  onSuccess,
  onError,
}: ShareFormProps) => {
  const onSubmit = async (values: {
    email: string;
    details: string;
    internshipKind: InternshipKind;
  }) => {
    const result =
      await outOfReduxDependencies.conventionGateway.shareConventionLinkByEmail(
        {
          ...values,
          conventionLink: window.location.href,
        },
      );
    result ? onSuccess() : onError();
  };
  const methods = useForm<ShareLinkByEmailDto>({
    mode: "onTouched",
    defaultValues: makeInitialValues({
      ...conventionFormData,
      link: window.location.href,
    }),
    resolver: zodResolver(shareLinkByEmailSchema),
  });
  const { register, handleSubmit, formState, reset } = methods;

  useEffect(() => {
    reset(
      makeInitialValues({
        ...conventionFormData,
        link: window.location.href,
      }),
    );
  }, [conventionFormData, reset]);
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      id={domElementIds.conventionImmersionRoute.shareForm}
    >
      <input type="hidden" {...register("conventionLink")} />
      <Input
        label="Adresse mail à qui partager la demande"
        nativeInputProps={{
          ...register("email"),
          type: "email",
          placeholder: "nom@exemple.com",
        }}
        state={formState.errors.email ? "error" : "default"}
        stateRelatedMessage={formState.errors.email?.message}
      />
      <Input
        label="Votre message (pour expliquer ce qui reste à compléter)"
        nativeTextAreaProps={{ ...register("details") }}
        textArea
        state={formState.errors.details ? "error" : "default"}
        stateRelatedMessage={formState.errors.details?.message}
      />
      <Button
        type="submit"
        title="Envoyer"
        disabled={!formState.isValid}
        id={domElementIds.conventionImmersionRoute.shareFormSubmitButton}
      >
        Envoyer
      </Button>
    </form>
  );
};
