import React from "react";
import { useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ManageEstablishmentAdminForm,
  manageEstablishmentAdminFormSchema,
} from "shared";
import { DsfrTitle } from "react-design-system";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";

export const ManageEstablishment = (): JSX.Element => {
  const { register, handleSubmit, formState } =
    useForm<ManageEstablishmentAdminForm>({
      resolver: zodResolver(manageEstablishmentAdminFormSchema),
      mode: "onTouched",
    });
  return (
    <>
      <DsfrTitle level={5} text="Piloter une entreprise" />
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
                id: "manageEstablishmentAdminForm-siret",
                placeholder: "ex: 1234567891234 ",
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("siret")}
            />
          </div>
          <Button
            title="Piloter l'entreprise"
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
