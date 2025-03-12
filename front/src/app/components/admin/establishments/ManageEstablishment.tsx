import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";
import {
  type ManageEstablishmentAdminForm,
  domElementIds,
  manageEstablishmentAdminFormSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";

export const ManageEstablishment = (): JSX.Element => {
  const { register, handleSubmit, formState, setValue } =
    useForm<ManageEstablishmentAdminForm>({
      resolver: zodResolver(manageEstablishmentAdminFormSchema),
      mode: "onTouched",
    });
  return (
    <>
      <h5 className={fr.cx("fr-h5")}>Piloter une entreprise</h5>
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <form
          onSubmit={handleSubmit(({ siret }) =>
            routes.manageEstablishmentAdmin({ siret }).push(),
          )}
        >
          <div className={fr.cx("fr-grid-row")}>
            <Input
              label="Siret de l'entreprise"
              nativeInputProps={{
                ...register("siret"),
                onChange: (event) => {
                  setValue("siret", event.currentTarget.value.trim(), {
                    shouldValidate: true,
                  });
                },
                id: domElementIds.admin.manageEstablishment.siretInput,
                placeholder: "ex: 1234567891234",
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("siret")}
            />
          </div>
          <Button
            id={domElementIds.admin.manageEstablishment.searchButton}
            disabled={!formState.isValid}
            className={fr.cx("fr-mt-2w")}
          >
            Piloter l'entreprise
          </Button>
        </form>
      </div>
    </>
  );
};
