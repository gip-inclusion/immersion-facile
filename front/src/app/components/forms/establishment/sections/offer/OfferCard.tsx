import { fr } from "@codegouvfr/react-dsfr";
import Badge from "@codegouvfr/react-dsfr/Badge";
import ButtonsGroup from "@codegouvfr/react-dsfr/ButtonsGroup";
import { useFormContext } from "react-hook-form";
import {
  domElementIds,
  type FormEstablishmentDto,
  remoteWorkModeLabels,
  removeAtIndex,
} from "shared";
import type { Mode } from "src/app/components/forms/establishment/EstablishmentForm";

export const OfferCard = ({
  index,
  mode,
  onEditOfferClick,
}: {
  index: number;
  mode: Mode;
  onEditOfferClick: () => void;
}) => {
  const { setValue, watch } = useFormContext<FormEstablishmentDto>();
  const formValues = watch();
  const { appellationLabel, remoteWorkMode } = formValues.offers[index];
  return (
    <div className={fr.cx("fr-col-12", "fr-col-lg-6")}>
      <article className={fr.cx("fr-card", "fr-px-4w", "fr-py-2w")}>
        <div className={fr.cx("fr-grid-row", "fr-grid-row--top")}>
          <h3 className={fr.cx("fr-h6", "fr-col-lg-7", "fr-col-5", "fr-mb-0")}>
            {appellationLabel}
          </h3>
          <Badge className={fr.cx("fr-badge--purple-glycine", "fr-ml-auto")}>
            {remoteWorkModeLabels[remoteWorkMode].label}
          </Badge>
        </div>
        <p className={fr.cx("fr-mt-2w", "fr-text--sm")}>
          {remoteWorkModeLabels[remoteWorkMode].description}
        </p>
        <ButtonsGroup
          buttons={[
            {
              children: "Modifier",
              iconPosition: "right",
              iconId: "fr-icon-edit-line",
              priority: "tertiary",
              type: "button",
              onClick: onEditOfferClick,
              id: `${domElementIds.establishment[mode].editOfferButton}-${index}`,
            },
            {
              children: "Supprimer",
              iconPosition: "right",
              iconId: "fr-icon-delete-bin-line",
              priority: "tertiary",
              type: "button",
              id: `${domElementIds.establishment[mode].deleteOfferButton}-${index}`,
              onClick: () => {
                const offers = formValues.offers;
                const newOffers = removeAtIndex(offers, index);
                setValue("offers", newOffers);
              },
            },
          ]}
          className={fr.cx("fr-mt-auto")}
          inlineLayoutWhen="always"
        />
      </article>
    </div>
  );
};
