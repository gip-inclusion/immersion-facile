import {
  type DiscussionDtoEmail,
  type EmailParamsByEmailType,
  errors,
  frontRoutes,
  getFormattedFirstnameAndLastname,
  type OmitFromExistingKeys,
} from "shared";
import type { AppConfig } from "../../../config/bootstrap/appConfig";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const makeContactByEmailRequestParams = async ({
  discussion,
  immersionFacileBaseUrl,
  uow,
}: {
  discussion: DiscussionDtoEmail;
  immersionFacileBaseUrl: AppConfig["immersionFacileBaseUrl"];
  uow: UnitOfWork;
}): Promise<EmailParamsByEmailType["CONTACT_BY_EMAIL_REQUEST"]> => {
  const appellationAndRomeDtos =
    await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodesIfExist(
      [discussion.appellationCode],
    );
  const appellationLabel = appellationAndRomeDtos.at(0)?.appellationLabel;

  if (!appellationLabel)
    throw errors.discussion.missingAppellationLabel({
      appellationCode: discussion.appellationCode,
    });

  const common: OmitFromExistingKeys<
    EmailParamsByEmailType["CONTACT_BY_EMAIL_REQUEST"],
    "immersionObjective" | "kind"
  > = {
    replyToEmail: discussion.potentialBeneficiary.email,
    appellationLabel,
    discussionUrl: `${immersionFacileBaseUrl}/${frontRoutes.establishmentDashboardDiscussions}/${discussion.id}?mtm_campaign=inbound-parsing-reponse-via-espace-entreprise&mtm_kwd=inbound-parsing-reponse-via-espace-entreprise`,
    businessName: discussion.businessName,
    businessAddress: `${discussion.address.streetNumberAndAddress} ${discussion.address.postcode} ${discussion.address.city}`,
    contactFirstName: getFormattedFirstnameAndLastname({
      firstname: discussion.establishmentContact.firstName,
    }),
    contactLastName: getFormattedFirstnameAndLastname({
      lastname: discussion.establishmentContact.lastName,
    }),
    potentialBeneficiaryFirstName: getFormattedFirstnameAndLastname({
      firstname: discussion.potentialBeneficiary.firstName,
    }),
    potentialBeneficiaryLastName: getFormattedFirstnameAndLastname({
      lastname: discussion.potentialBeneficiary.lastName,
    }),
    potentialBeneficiaryPhone: discussion.potentialBeneficiary.phone,
    potentialBeneficiaryDatePreferences:
      discussion.potentialBeneficiary.datePreferences,
  };

  return discussion.kind === "IF"
    ? {
        ...common,
        kind: discussion.kind,
        immersionObjective:
          discussion.potentialBeneficiary.immersionObjective ?? undefined,
        potentialBeneficiaryResumeLink:
          discussion.potentialBeneficiary.resumeLink,
        potentialBeneficiaryExperienceAdditionalInformation:
          discussion.potentialBeneficiary.experienceAdditionalInformation,
        potentialBeneficiaryHasWorkingExperience:
          discussion.potentialBeneficiary.hasWorkingExperience,
      }
    : {
        ...common,
        kind: discussion.kind,
        immersionObjective: discussion.potentialBeneficiary.immersionObjective,
        levelOfEducation: discussion.potentialBeneficiary.levelOfEducation,
      };
};
