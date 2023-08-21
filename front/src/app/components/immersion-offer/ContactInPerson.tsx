import React from "react";
import { useForm } from "react-hook-form";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route } from "type-route";
import {
  AppellationDto,
  ContactEstablishmentInPersonDto,
  contactEstablishmentInPersonSchema,
  domElementIds,
  SiretDto,
} from "shared";
import { useContactEstablishmentError } from "src/app/components/search/useContactEstablishmentError";
import { usePotentialBeneficiaryValues } from "src/app/components/search/usePotentialBeneficiaryValues";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes, useRoute } from "src/app/routes/routes";
import { immersionSearchGateway } from "src/config/dependencies";

type ContactInPersonProps = {
  siret: SiretDto;
  appellations: AppellationDto[];
  onSubmitSuccess: () => void;
};

export const ContactInPerson = ({
  siret,
  appellations,
  onSubmitSuccess,
}: ContactInPersonProps) => {
  const { activeError, setActiveErrorKind } = useContactEstablishmentError();
  const route = useRoute() as Route<typeof routes.immersionOffer>;

  const initialValues: ContactEstablishmentInPersonDto = {
    siret,
    appellationCode:
      appellations.length > 1 ? "" : appellations[0].appellationCode,
    contactMode: "IN_PERSON",
    potentialBeneficiaryFirstName: route.params.contactFirstName ?? "",
    potentialBeneficiaryLastName: route.params.contactLastName ?? "",
    potentialBeneficiaryEmail: route.params.contactEmail ?? "",
  };

  const appellationListOfOptions = appellations.map((appellation) => ({
    value: appellation.appellationCode,
    label: appellation.appellationLabel,
  }));

  const methods = useForm<ContactEstablishmentInPersonDto>({
    resolver: zodResolver(contactEstablishmentInPersonSchema),
    mode: "onTouched",
    defaultValues: initialValues,
  });
  const {
    register,
    handleSubmit,
    formState,
    formState: { isSubmitting },
  } = methods;

  usePotentialBeneficiaryValues(initialValues, methods, appellations);

  const getFieldError = makeFieldError(formState);

  const onFormValid = async (values: ContactEstablishmentInPersonDto) => {
    const errorKind = await immersionSearchGateway.contactEstablishment(values);
    if (errorKind) return setActiveErrorKind(errorKind);
    onSubmitSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onFormValid)}>
      <>
        <p className={"fr-my-2w"}>
          Cette entreprise souhaite que vous vous présentiez directement pour
          candidater.
        </p>
        <p className={"fr-my-2w"}>
          Merci de nous indiquer vos coordonnées. Vous recevrez par e-mail le
          nom de la personne à contacter ainsi que des conseils pour présenter
          votre demande d’immersion. Ces informations sont personnelles et
          confidentielles. Elles ne peuvent pas être communiquées à d’autres
          personnes.
        </p>
        <p className={"fr-my-2w"}>Merci !</p>
        {appellations.length > 1 && (
          <Select
            label={"Métier sur lequel porte la demande d'immersion *"}
            options={appellationListOfOptions}
            placeholder={"Sélectionnez un métier"}
            nativeSelectProps={{
              ...register("appellationCode"),
            }}
            {...getFieldError("appellationCode")}
          />
        )}
        <Input
          label="Votre email *"
          nativeInputProps={{
            ...register("potentialBeneficiaryEmail"),
            type: "email",
          }}
          {...getFieldError("potentialBeneficiaryEmail")}
        />
        <Input
          label="Votre prénom *"
          nativeInputProps={register("potentialBeneficiaryFirstName")}
          {...getFieldError("potentialBeneficiaryFirstName")}
        />
        <Input
          label="Votre nom *"
          nativeInputProps={register("potentialBeneficiaryLastName")}
          {...getFieldError("potentialBeneficiaryLastName")}
        />

        <Button
          priority="secondary"
          type="submit"
          disabled={isSubmitting || activeError.isActive}
          nativeButtonProps={{
            id: domElementIds.search.contactInPersonButton,
          }}
        >
          Envoyer
        </Button>

        {activeError.isActive && (
          <Alert
            severity="error"
            title={activeError.title}
            description={activeError.description}
          />
        )}
      </>
    </form>
  );
};
