import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { toDotNotation, WithAgencyIds, withAgencyIdsSchema } from "shared";
import { ErrorNotifications } from "react-design-system";
import { formErrorsToFlatErrors } from "src/app/hooks/formContents.hooks";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { agencyAdminSelectors } from "src/core-logic/domain/agenciesAdmin/agencyAdmin.selectors";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { inclusionConnectedSlice } from "src/core-logic/domain/inclusionConnected/inclusionConnected.slice";
import { AgencyAutocomplete } from "../../agency/AgencyAutocomplete";

export const RegisterAgenciesForm = () => {
  const { handleSubmit, setValue, formState } = useForm<WithAgencyIds>({
    defaultValues: {
      agencies: [],
    },
    resolver: zodResolver(withAgencyIdsSchema),
  });
  const dispatch = useDispatch();
  const { agency } = useAppSelector(agencyAdminSelectors.agencyState);
  const feedback = useAppSelector(inclusionConnectedSelectors.feedback);

  useEffect(() => {
    if (agency) {
      setValue("agencies", [agency.id]);
    }
  }, [agency?.id]);

  return (
    <>
      {feedback.kind === "idle" ||
        (feedback.kind === "errored" && (
          <>
            <p>
              C'est votre première connexion sur Immersion Facilitée avec votre
              compte Inclusion Connect, choisissez l'organisme auquel nous
              devons vous associer.
            </p>
            <form
              onSubmit={handleSubmit((values) =>
                dispatch(
                  inclusionConnectedSlice.actions.registerAgenciesRequested(
                    values,
                  ),
                ),
              )}
            >
              <AgencyAutocomplete
                title="Commencez à taper le nom de votre organisme"
                placeholder="Ex: Agence de Berry"
              />
              <ErrorNotifications
                errors={toDotNotation(formErrorsToFlatErrors(formState.errors))}
                visible={keys(formState.errors).length > 0}
              />
              <div className={fr.cx("fr-mt-2w")}>
                <Button>M'associer à cet organisme</Button>
              </div>
            </form>
          </>
        ))}
      {feedback.kind === "success" && (
        <Alert
          severity="success"
          title="Bravo !"
          description="Votre demande de première connexion a bien été reçue. Vous recevrez un email de confirmation dès qu'elle aura  été acceptée par nos équipes (2-7 jours ouvrés)."
        />
      )}
    </>
  );
};
