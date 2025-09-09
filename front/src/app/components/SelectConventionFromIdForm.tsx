import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";

import { useForm } from "react-hook-form";
import {
  domElementIds,
  type ManageConventionAdminForm,
  manageConventionAdminFormSchema,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";
import type { Route } from "type-route";

type SelectConventionFromIdFormProps = {
  routeNameToRedirectTo: Route<
    | typeof routes.adminConventionDetail
    | typeof routes.manageConventionConnectedUser
  >["name"];
};

export const SelectConventionFromIdForm = ({
  routeNameToRedirectTo,
}: SelectConventionFromIdFormProps): JSX.Element => {
  const { register, handleSubmit, formState, setValue } =
    useForm<ManageConventionAdminForm>({
      resolver: zodResolver(manageConventionAdminFormSchema),
      mode: "onTouched",
    });
  const { isValid } = formState;
  return (
    <div className={fr.cx("fr-mb-4w")}>
      <form
        onSubmit={handleSubmit(({ conventionId }) => {
          routes[routeNameToRedirectTo]({ conventionId }).push();
        })}
      >
        <div className={fr.cx("fr-grid-row")}>
          <Input
            label="Identifiant de la convention *"
            nativeInputProps={{
              ...register("conventionId"),
              id: "manageConventionAdminForm-conventionId",
              placeholder: "Ex: cf0755c7-e014-4515-82fa-39270f1db6d8",
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
  );
};
