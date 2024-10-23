import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import React from "react";
import { useForm } from "react-hook-form";
import {
  ManageConventionAdminForm,
  domElementIds,
  manageConventionAdminFormSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";

type ManageConventionFormSectionProps = {
  routeNameToRedirectTo: Route<
    | typeof routes.adminConventionDetail
    | typeof routes.manageConventionInclusionConnected
  >["name"];
};

export const ManageConventionFormSection = ({
  routeNameToRedirectTo,
}: ManageConventionFormSectionProps): JSX.Element => {
  const { register, handleSubmit, formState, setValue } =
    useForm<ManageConventionAdminForm>({
      resolver: zodResolver(manageConventionAdminFormSchema),
      mode: "onTouched",
    });
  const { isValid } = formState;
  return (
    <>
      <h2 className={fr.cx("fr-h5", "fr-mb-2w")}>Piloter une convention</h2>
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
                onChange: (event) => {
                  setValue("conventionId", event.currentTarget.value.trim(), {
                    shouldValidate: true,
                  });
                },
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("conventionId")}
            />
          </div>
          <Button
            title="Piloter la convention"
            disabled={!isValid}
            className={fr.cx("fr-mt-2w")}
            id={
              domElementIds.establishmentDashboard.manageConventionForm
                .submitButton
            }
          >
            Piloter la convention
          </Button>
        </form>
      </div>
    </>
  );
};
