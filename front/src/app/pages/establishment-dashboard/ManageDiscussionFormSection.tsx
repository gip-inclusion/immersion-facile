import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import Input from "@codegouvfr/react-dsfr/Input";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  domElementIds,
  type WithDiscussionId,
  withDiscussionSchemaId,
} from "shared";
import { makeFieldError } from "src/app/hooks/formContents.hooks";
import { routes } from "src/app/routes/routes";

export const ManageDiscussionFormSection = (): JSX.Element => {
  const { register, handleSubmit, formState, setValue } =
    useForm<WithDiscussionId>({
      resolver: zodResolver(withDiscussionSchemaId),
      mode: "onTouched",
    });
  const { isValid } = formState;
  return (
    <>
      <div className={fr.cx("fr-mb-4w")}>
        <form
          onSubmit={handleSubmit(({ discussionId }) => {
            routes.establishmentDashboardDiscussions({ discussionId }).push();
          })}
        >
          <div className={fr.cx("fr-grid-row")}>
            <Input
              label="Identifiant de la candidature *"
              nativeInputProps={{
                ...register("discussionId"),
                id: domElementIds.establishmentDashboard.manageDiscussion
                  .discussionIdInput,
                placeholder: "Ex: cf0755c7-e014-4515-82fa-39270f1db6d8",
                onChange: (event) => {
                  setValue("discussionId", event.currentTarget.value.trim(), {
                    shouldValidate: true,
                  });
                },
              }}
              className={fr.cx("fr-col-12", "fr-col-lg-6")}
              {...makeFieldError(formState)("discussionId")}
            />
          </div>
          <Button
            title="Piloter la mise en relation"
            disabled={!isValid}
            className={fr.cx("fr-mt-2w")}
            id={
              domElementIds.establishmentDashboard.manageDiscussion.submitButton
            }
          >
            Piloter la mise en relation
          </Button>
        </form>
      </div>
    </>
  );
};
