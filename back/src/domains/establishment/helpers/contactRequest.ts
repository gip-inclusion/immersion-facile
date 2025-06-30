import {
  type DiscussionDtoEmail,
  type EmailParamsByEmailType,
  type OmitFromExistingKeys,
  errors,
  getFormattedFirstnameAndLastname,
} from "shared";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const makeContactByEmailRequestParams = async ({
  discussion,
  domain,
  uow,
}: {
  discussion: DiscussionDtoEmail;
  domain: string;
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
    domain,
    discussionId: discussion.id,
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
