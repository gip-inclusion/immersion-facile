import { fr } from "@codegouvfr/react-dsfr";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React from "react";
import { ErrorNotifications } from "react-design-system";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { AgencyOption, agencyOptionSchema, domElementIds } from "shared";
import { formAgencyFieldsLabels } from "src/app/contents/forms/agency/formAgency";
import {
  displayReadableError,
  getFormContents,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { z } from "zod";
import { MultipleAgencyInput } from "./MultipleAgencyInput";

type WithAgenciesOptions = {
  agencies: AgencyOption[];
};

const registerAgenciesFormSchema: z.Schema<WithAgenciesOptions> = z.object({
  agencies: z.array(agencyOptionSchema).nonempty(),
});

export const RegisterAgenciesForm = () => {
  const { handleSubmit, setValue, formState, getValues, watch } =
    useForm<WithAgenciesOptions>({
      defaultValues: {
        agencies: [],
      },
      resolver: zodResolver(registerAgenciesFormSchema),
    });
  const { getFormErrors } = getFormContents(formAgencyFieldsLabels);
  const dispatch = useDispatch();
  return (
    <>
      <p className={fr.cx("fr-mt-4w")}>
        C'est votre première connexion sur Immersion Facilitée, choisissez la
        structure à laquelle nous devons vous associer.
      </p>
      <form
        onSubmit={handleSubmit((values) =>
          dispatch(
            inclusionConnectedSlice.actions.registerAgenciesRequested({
              agencies: values.agencies.map((agency) => agency.id),
              feedbackTopic: "dashboard-agency-register-user",
            }),
          ),
        )}
        id={domElementIds.agencyDashboard.registerAgencies.form}
      >
        <MultipleAgencyInput
          initialAgencies={watch("agencies")}
          label="Organisme(s) au(x)quel(s) vous êtes rattaché(s)"
          id={domElementIds.agencyDashboard.registerAgencies.agencyAutocomplete}
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
          errorsWithLabels={toErrorsWithLabels({
            errors: displayReadableError(formState.errors),
            labels: getFormErrors(),
          })}
          visible={keys(formState.errors).length > 0}
        />
        <div className={fr.cx("fr-mt-2w")}>
          <Button
            id={domElementIds.agencyDashboard.registerAgencies.submitButton}
          >
            Demander à être relié à ces structures
          </Button>
        </div>
      </form>
    </>
  );
};
