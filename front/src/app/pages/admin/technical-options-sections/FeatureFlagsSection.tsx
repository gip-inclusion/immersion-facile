import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import Select from "@codegouvfr/react-dsfr/SelectNext";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import React, { ReactNode } from "react";
import { ErrorNotifications } from "react-design-system";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import {
  FeatureFlagName,
  FeatureFlagTextImageAndRedirect,
  FeatureFlagTextWithSeverity,
  featureFlagTextImageAndRedirectValueSchema,
  featureFlagTextWithSeverityValueSchema,
} from "shared";
import {
  formTextImageAndRedirectFieldsLabels,
  formTextWithOptionsFieldsLabels,
} from "src/app/contents/forms/admin/technicalOptions";
import {
  displayReadableError,
  getFormContents,
  toErrorsWithLabels,
} from "src/app/hooks/formContents.hooks";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { match } from "ts-pattern";

export const FeatureFlagsSection = () => {
  const dispatch = useDispatch();
  const { isLoading, ...featureFlags } = useFeatureFlags();

  return (
    <>
      <h4>Les fonctionnalités optionnelles</h4>
      <FeatureFlagListWrapper>
        <>
          {!isLoading &&
            keys(labelsByFeatureFlag).map((featureFlagName, index) => (
              <div
                key={featureFlagName}
                className={fr.cx(index > 0 && "fr-mt-4w")}
              >
                <h5>{labelsByFeatureFlag[featureFlagName].title}</h5>
                <ToggleSwitch
                  label={labelsByFeatureFlag[featureFlagName].enableLabel}
                  checked={featureFlags[featureFlagName].isActive}
                  showCheckedHint={false}
                  onChange={() => {
                    const isConfirmed = window.confirm(
                      "Vous aller changer ce réglage pour tous les utilisateurs, voulez-vous confirmer ?",
                    );

                    if (isConfirmed)
                      dispatch(
                        featureFlagsSlice.actions.setFeatureFlagRequested({
                          flagName: featureFlagName,
                          featureFlag: {
                            ...featureFlags[featureFlagName],
                            isActive: !featureFlags[featureFlagName].isActive,
                          },
                        }),
                      );
                  }}
                />
                {match(featureFlags[featureFlagName])
                  .with({ kind: "textWithSeverity" }, (featureFlagText) => (
                    <FeatureFlagTextWithSeverityForm
                      featureFlag={featureFlagText}
                      featureFlagName={featureFlagName}
                    />
                  ))
                  .with(
                    { kind: "textImageAndRedirect" },
                    (featureFlagTextImageAndRedirect) => (
                      <FeatureFlagTextImageAndRedirectForm
                        featureFlag={featureFlagTextImageAndRedirect}
                        featureFlagName={featureFlagName}
                      />
                    ),
                  )
                  .with({ kind: "boolean" }, () => null)
                  .exhaustive()}
              </div>
            ))}
        </>
      </FeatureFlagListWrapper>
    </>
  );
};

const FeatureFlagListWrapper = ({ children }: { children: ReactNode }) => (
  <div className={fr.cx("fr-grid-row")}>
    <div className={fr.cx("fr-col")}>
      <div className={fr.cx("fr-input-group")}>
        <fieldset className={fr.cx("fr-fieldset")}>
          <div className={fr.cx("fr-fieldset__content")}>{children}</div>
        </fieldset>
      </div>
    </div>
  </div>
);

const labelsByFeatureFlag: Record<
  FeatureFlagName,
  {
    title: string;
    enableLabel: string;
  }
> = {
  enableTemporaryOperation: {
    title: "Offre temporaire",
    enableLabel: "Activer l'offre temporaire",
  },
  enableMaintenance: {
    title: "Maintenance",
    enableLabel: "Activer le mode maintenance",
  },
  enableSearchByScore: {
    title: "Recherche par pertinence",
    enableLabel: "Activer la recherche par pertinence (scoring)",
  },
  enableProConnect: {
    enableLabel: "Activer le mode Pro Connect",
    title: "Passer de Inclusion Connect à Pro Connect",
  },
};

const FeatureFlagTextWithSeverityForm = ({
  featureFlag,
  featureFlagName,
}: {
  featureFlag: FeatureFlagTextWithSeverity;
  featureFlagName: FeatureFlagName;
}) => {
  const dispatch = useDispatch();

  const { register, handleSubmit, formState } = useForm<
    FeatureFlagTextWithSeverity["value"]
  >({
    defaultValues: featureFlag.value,
    mode: "onTouched",
    resolver: zodResolver(featureFlagTextWithSeverityValueSchema),
  });

  const { getFormErrors, getFormFields } = getFormContents(
    formTextWithOptionsFieldsLabels,
  );

  const formFields = getFormFields();

  const onFormSubmit = (value: FeatureFlagTextWithSeverity["value"]) => {
    dispatch(
      featureFlagsSlice.actions.setFeatureFlagRequested({
        flagName: featureFlagName,
        featureFlag: {
          ...featureFlag,
          value,
        },
      }),
    );
  };

  return (
    <form className={fr.cx("fr-ml-9w")} onSubmit={handleSubmit(onFormSubmit)}>
      <Input
        {...formFields.message}
        textArea
        nativeTextAreaProps={{
          ...formFields.message,
          ...register("message"),
        }}
      />
      {formFields.severity.options && (
        <Select
          {...formFields.severity}
          nativeSelectProps={{
            ...register("severity"),
          }}
          options={formFields.severity.options}
        />
      )}

      <ErrorNotifications
        errorsWithLabels={toErrorsWithLabels({
          errors: displayReadableError(formState.errors),
          labels: getFormErrors(),
        })}
        visible={
          formState.submitCount !== 0 &&
          Object.values(formState.errors).length > 0
        }
      />
      <Button size="small">Mettre à jour cette option</Button>
    </form>
  );
};

const FeatureFlagTextImageAndRedirectForm = ({
  featureFlag,
  featureFlagName,
}: {
  featureFlag: FeatureFlagTextImageAndRedirect;
  featureFlagName: FeatureFlagName;
}) => {
  const dispatch = useDispatch();

  const { register, handleSubmit, formState } = useForm<
    FeatureFlagTextImageAndRedirect["value"]
  >({
    defaultValues: featureFlag.value,
    mode: "onTouched",
    resolver: zodResolver(featureFlagTextImageAndRedirectValueSchema),
  });
  const { getFormErrors, getFormFields } = getFormContents(
    formTextImageAndRedirectFieldsLabels,
  );

  const formFields = getFormFields();

  const onFormSubmit = (value: FeatureFlagTextImageAndRedirect["value"]) => {
    dispatch(
      featureFlagsSlice.actions.setFeatureFlagRequested({
        flagName: featureFlagName,
        featureFlag: {
          ...featureFlag,
          value,
        },
      }),
    );
  };

  return (
    <form className={fr.cx("fr-ml-9w")} onSubmit={handleSubmit(onFormSubmit)}>
      <Input
        {...formFields.overtitle}
        nativeInputProps={{
          ...formFields.overtitle,
          ...register("overtitle"),
        }}
      />
      <Input
        {...formFields.title}
        nativeInputProps={{
          ...formFields.title,
          ...register("title"),
        }}
      />
      <Input
        {...formFields.message}
        label="Message (optionel)"
        nativeInputProps={{
          ...formFields.message,
          ...register("message"),
        }}
      />
      <Input
        {...formFields.imageUrl}
        nativeInputProps={{
          ...formFields.imageUrl,
          ...register("imageUrl"),
        }}
      />
      <Input
        {...formFields.imageAlt}
        nativeInputProps={{
          ...formFields.imageAlt,
          ...register("imageAlt"),
        }}
      />
      <Input
        {...formFields.redirectUrl}
        nativeInputProps={{
          ...formFields.redirectUrl,
          ...register("redirectUrl"),
        }}
      />
      <ErrorNotifications
        errorsWithLabels={toErrorsWithLabels({
          errors: displayReadableError(formState.errors),
          labels: getFormErrors(),
        })}
        visible={
          formState.submitCount !== 0 &&
          Object.values(formState.errors).length > 0
        }
      />
      <Button size="small">Mettre à jour cette option</Button>
    </form>
  );
};
