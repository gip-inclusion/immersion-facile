import React, { ReactNode } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { fr } from "@codegouvfr/react-dsfr";
import Button from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import ToggleSwitch from "@codegouvfr/react-dsfr/ToggleSwitch";
import { zodResolver } from "@hookform/resolvers/zod";
import { keys } from "ramda";
import { match } from "ts-pattern";
import {
  FeatureFlagName,
  FeatureFlagText,
  FeatureFlagTextImageAndRedirect,
  featureFlagTextImageAndRedirectValueSchema,
  featureFlagTextValueSchema,
} from "shared";
import { commonContent } from "src/app/contents/commonContent";
import { useFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";

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
                  // .with({ kind: "boolean" }, () => null)
                  .with({ kind: "text" }, (featureFlagText) => (
                    <FeatureFlagTextForm
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
};

const FeatureFlagTextForm = ({
  featureFlag,
  featureFlagName,
}: {
  featureFlag: FeatureFlagText;
  featureFlagName: FeatureFlagName;
}) => {
  const dispatch = useDispatch();

  const { handleSubmit, register } = useForm<FeatureFlagText["value"]>({
    defaultValues: featureFlag.value,
    mode: "onTouched",
    resolver: zodResolver(featureFlagTextValueSchema),
  });

  const onFormSubmit = (value: FeatureFlagText["value"]) => {
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
        textArea
        label={"Message"}
        nativeTextAreaProps={{
          ...register("message"),
          placeholder: commonContent.maintenanceMessage,
        }}
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

  const { register, handleSubmit } = useForm<
    FeatureFlagTextImageAndRedirect["value"]
  >({
    defaultValues: featureFlag.value,
    mode: "onTouched",
    resolver: zodResolver(featureFlagTextImageAndRedirectValueSchema),
  });

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
        label="Message"
        nativeInputProps={{
          ...register("message"),
          placeholder: commonContent.maintenanceMessage,
        }}
      />
      <Input
        label="Addresse de l'image"
        hintText="https://www.mon-site.com/mon-image.jpg"
        nativeInputProps={{
          ...register("imageUrl"),
        }}
      />
      <Input
        label="Texte alternatif de l'image"
        nativeInputProps={{
          ...register("imageAlt"),
        }}
      />
      <Input
        label="URL du lien"
        hintText="https://www.mon-site.com/mon-lien"
        nativeInputProps={{
          ...register("redirectUrl"),
        }}
      />
      <Button size="small">Mettre à jour cette option</Button>
    </form>
  );
};
