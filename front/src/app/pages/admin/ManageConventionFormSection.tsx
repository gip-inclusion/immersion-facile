import React from "react";
import { useForm } from "react-hook-form";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route } from "type-route";
import {
  ManageConventionAdminForm,
  manageConventionAdminFormSchema,
} from "shared";
import { DsfrTitle } from "react-design-system";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";

type ManageConventionFormSectionProps = {
  routeNameToRedirectTo: Route<
    | typeof routes.manageConventionAdmin
    | typeof routes.manageConventionInclusionConnected
  >["name"];
};

export const ManageConventionFormSection = ({
  routeNameToRedirectTo,
}: ManageConventionFormSectionProps): JSX.Element => {
  const { register, handleSubmit, formState } =
    useForm<ManageConventionAdminForm>({
      resolver: zodResolver(manageConventionAdminFormSchema),
      mode: "onTouched",
    });

  return (
    <>
      <DsfrTitle level={5} text="Piloter une convention" />
      <div className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w", "fr-mb-4w")}>
        <form
          onSubmit={handleSubmit(({ conventionId }) => {
            routes[routeNameToRedirectTo]({ conventionId }).push();
          })}
        >
          <div className={fr.cx("fr-grid-row")}>
            <Input
              label="Id de la convention *"
              nativeInputProps={{
                ...register("conventionId"),
                id: "manageConventionAdminForm-conventionId",
                placeholder: "Id de la convention",
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("conventionId")}
            />
          </div>
          <Button
            title="Piloter la convention"
            disabled={!formState.isValid}
            className={fr.cx("fr-mt-2w")}
          >
            Piloter la convention
          </Button>
        </form>
      </div>
    </>
  );
};
