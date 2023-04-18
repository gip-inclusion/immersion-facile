import React from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { z } from "zod";
import { agencyIdAndNameSchema, AgencyOption, toDotNotation } from "shared";
import { ErrorNotifications } from "react-design-system";
import { formErrorsToFlatErrors } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { MultipleAgencyInput } from "./MultipleAgencyInput";

type WithAgenciesOptions = {
  agencies: AgencyOption[];
};

const registerAgenciesFormSchema: z.Schema<WithAgenciesOptions> = z.object({
  agencies: z.array(agencyIdAndNameSchema).nonempty(),
});

export const RegisterAgenciesForm = () => {
  const { handleSubmit, setValue, formState, getValues, watch } =
    useForm<WithAgenciesOptions>({
      defaultValues: {
        agencies: [],
      },
      resolver: zodResolver(registerAgenciesFormSchema),
    });
  const dispatch = useDispatch();
  const feedback = useAppSelector(inclusionConnectedSelectors.feedback);
  return (
    <>
      {feedback.kind !== "agencyRegistrationSuccess" && (
        <>
          <p>
            C'est votre première connexion sur Immersion Facilitée avec votre
            compte Inclusion Connect, choisissez l'organisme auquel nous devons
            vous associer.
          </p>
          <form
            onSubmit={handleSubmit((values) =>
              dispatch(
                inclusionConnectedSlice.actions.registerAgenciesRequested({
                  agencies: values.agencies.map((agency) => agency.id),
                }),
              ),
            )}
          >
            <MultipleAgencyInput
              initialAgencies={watch("agencies")}
              label="Organisme(s) au(x)quel(s) vous êtes rattaché(s)"
              onAgencyAdd={(agency) => {
                setValue("agencies", [...getValues("agencies"), agency]);
              }}
              onAgencyDelete={(agency) => {
                setValue(
                  "agencies",
                  getValues("agencies").filter(
                    (agencyOption) => agencyOption.id !== agency.id,
                  ),
                );
              }}
            />
            <ErrorNotifications
              errors={toDotNotation(formErrorsToFlatErrors(formState.errors))}
              visible={keys(formState.errors).length > 0}
            />
            <div className={fr.cx("fr-mt-2w")}>
              <Button>Demander à être relié à ces organismes</Button>
            </div>
          </form>
        </>
      )}
      {feedback.kind === "agencyRegistrationSuccess" && (
        <Alert
          severity="success"
          title="Bravo !"
          description="Votre demande de première connexion a bien été reçue. Vous recevrez un email de confirmation dès qu'elle aura  été acceptée par nos équipes (2-7 jours ouvrés)."
        />
      )}
    </>
  );
};
