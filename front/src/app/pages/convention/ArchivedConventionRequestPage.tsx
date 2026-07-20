import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import RadioButtons from "@codegouvfr/react-dsfr/RadioButtons";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PageHeader } from "react-design-system";
import { type DefaultValues, FormProvider, useForm } from "react-hook-form";
import {
  type ArchivedConventionRequestFormDto,
  archivedConventionRequestSchema,
  domElementIds,
  type frontRoutes,
} from "shared";
import { AppellationAutocomplete } from "src/app/components/forms/autocomplete/AppellationAutocomplete";
import { ConnectedPrivateRoutePage } from "src/app/pages/auth/ConnectedPrivateRoutePage";
import type { Route } from "type-route";

type ArchivedConventionRequestPageProps = {
  route: Route<typeof frontRoutes.archivedConventionRequest>;
};

const initialValues: DefaultValues<ArchivedConventionRequestFormDto> = {
  conventionSearchMethod: "withConventionId",
  conventionId: "",
};

export const ArchivedConventionRequestPage = ({
  route,
}: ArchivedConventionRequestPageProps) => {
  const [validatedRequest, setValidatedRequest] =
    useState<ArchivedConventionRequestFormDto | null>(null);
  const methods = useForm<ArchivedConventionRequestFormDto>({
    resolver: zodResolver(archivedConventionRequestSchema),
    mode: "onTouched",
    defaultValues: initialValues,
    shouldUnregister: true,
  });
  const {
    formState: { errors },
    handleSubmit,
    register,
    setValue,
    watch,
  } = methods;
  const conventionSearchMethod = watch("conventionSearchMethod");
  const reason = watch("reason");

  const onSubmit = (values: ArchivedConventionRequestFormDto) => {
    console.log("values", values);
    setValidatedRequest(values);
  };

  return (
    <ConnectedPrivateRoutePage
      route={route}
      oAuthConnectionPageHeader={
        <PageHeader title="Vous devez vous connecter pour accéder à une convention archivée" />
      }
    >
      <h1>Demande d'accès à une convention archivée</h1>
      <p className={fr.cx("fr-text--lead")}>
        Les conventions de plus de 2 ans sont automatiquement archivées. Pour
        des raisons légales ou de suivi, vous pouvez demander la récupération
        d'une convention et de son bilan.
      </p>
      <FormProvider {...methods}>
        <form
          id={domElementIds.archivedConventionRequest.form}
          onSubmit={handleSubmit(onSubmit)}
        >
          <h2 className={fr.cx("fr-h6", "fr-mt-4w")}>
            Données de la convention
          </h2>
          <p>
            Renseignez l'identifiant exact de la convention ou les informations
            détaillées permettant à notre équipe de la retrouver.
          </p>
          <RadioButtons
            id={domElementIds.archivedConventionRequest.conventionSearchMethod}
            legend="Informations disponibles"
            options={[
              {
                label: "Je connais l'identifiant de la convention",
                nativeInputProps: {
                  value: "withConventionId",
                  ...register("conventionSearchMethod"),
                },
              },
              {
                label: "Je ne connais pas l'identifiant de la convention",
                nativeInputProps: {
                  value: "withConventionDetails",
                  ...register("conventionSearchMethod"),
                },
              },
            ]}
            state={errors.conventionSearchMethod ? "error" : "default"}
            stateRelatedMessage={errors.conventionSearchMethod?.message}
          />
          {conventionSearchMethod === "withConventionId" ? (
            <Input
              label="ID de la convention *"
              nativeInputProps={{
                id: domElementIds.archivedConventionRequest.conventionIdInput,
                ...register("conventionId"),
              }}
              state={errors.conventionId ? "error" : "default"}
              stateRelatedMessage={errors.conventionId?.message}
            />
          ) : (
            <>
              <Input
                label="Nom du bénéficiaire *"
                nativeInputProps={{
                  id: domElementIds.archivedConventionRequest
                    .beneficiaryLastNameInput,
                  ...register("beneficiaryLastName"),
                }}
                state={errors.beneficiaryLastName ? "error" : "default"}
                stateRelatedMessage={errors.beneficiaryLastName?.message}
              />
              <Input
                label="Prénom du bénéficiaire *"
                nativeInputProps={{
                  id: domElementIds.archivedConventionRequest
                    .beneficiaryFirstNameInput,
                  ...register("beneficiaryFirstName"),
                }}
                state={errors.beneficiaryFirstName ? "error" : "default"}
                stateRelatedMessage={errors.beneficiaryFirstName?.message}
              />
              <Input
                label="SIRET de l'entreprise *"
                hintText={
                  <>
                    Vous pouvez le retrouver sur{" "}
                    <a
                      href="https://annuaire-entreprises.data.gouv.fr/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      l'annuaire des entreprises
                    </a>
                    .
                  </>
                }
                nativeInputProps={{
                  id: domElementIds.archivedConventionRequest.siretInput,
                  ...register("siret"),
                }}
                state={errors.siret ? "error" : "default"}
                stateRelatedMessage={errors.siret?.message}
              />
              <Input
                label="Date estimée de l'immersion *"
                nativeInputProps={{
                  id: domElementIds.archivedConventionRequest
                    .immersionDateInput,
                  ...register("immersionDate"),
                }}
                state={errors.immersionDate ? "error" : "default"}
                stateRelatedMessage={errors.immersionDate?.message}
              />
              <div className={fr.cx("fr-input-group")}>
                <AppellationAutocomplete
                  locator="archived-convention-request"
                  label="Métier *"
                  onAppellationSelected={(appellationMatch) => {
                    setValue(
                      "immersionAppellation",
                      appellationMatch.appellation,
                      { shouldValidate: true },
                    );
                  }}
                  onAppellationClear={() => {
                    setValue("immersionAppellation", undefined, {
                      shouldValidate: true,
                    });
                  }}
                  selectProps={{
                    inputId:
                      domElementIds.archivedConventionRequest
                        .appellationAutocomplete,
                  }}
                  state={errors.immersionAppellation ? "error" : undefined}
                  stateRelatedMessage={errors.immersionAppellation?.message}
                />
              </div>
            </>
          )}
          <Select
            label="Raison de la demande *"
            placeholder="Sélectionner un motif"
            options={reasonOptions}
            nativeSelectProps={{
              id: domElementIds.archivedConventionRequest.reasonSelect,
              ...register("reason"),
            }}
            state={errors.reason ? "error" : "default"}
            stateRelatedMessage={errors.reason?.message}
          />
          {reason === "other" && (
            <Input
              label="Précisez le motif *"
              textArea
              nativeTextAreaProps={{
                id: domElementIds.archivedConventionRequest.otherReasonInput,
                ...register("otherReason"),
              }}
              state={errors.otherReason ? "error" : "default"}
              stateRelatedMessage={errors.otherReason?.message}
            />
          )}
          <Button
            type="submit"
            nativeButtonProps={{
              id: domElementIds.archivedConventionRequest.submitButton,
            }}
          >
            Envoyer la demande
          </Button>
        </form>
      </FormProvider>
      {validatedRequest && (
        <Alert
          className={fr.cx("fr-mt-4w")}
          severity="success"
          title="La demande est valide"
          description="Le raccordement à l'envoi de la demande pourra être ajouté à l'étape suivante."
        />
      )}
    </ConnectedPrivateRoutePage>
  );
};

const reasonOptions: {
  label: string;
  value: ArchivedConventionRequestFormDto["reason"];
}[] = [
  {
    label: "Contentieux juridique",
    value: "legalDispute",
  },
  {
    label: "Contrôle URSSAF ou inspection du travail",
    value: "urssafOrInspectionControl",
  },
  {
    label:
      "Demande d'accès d'un conseiller du Réseau pour l'emploi (RPE) sur l'historique d'une personne",
    value: "rpeAdvisorAccessToBeneficiaryHistory",
  },
  {
    label: "Autre",
    value: "other",
  },
];
