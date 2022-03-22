import { z } from "zod";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { FormEstablishmentDto } from "../../../shared/FormEstablishmentDto";
import { EstablishmentJwtPayload } from "../../../shared/tokens/MagicLinkPayload";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

export class RetrieveFormEstablishmentFromAggregates extends TransactionalUseCase<
  void,
  FormEstablishmentDto,
  EstablishmentJwtPayload
> {
  inputSchema = z.void();

  constructor(uowPerformer: UnitOfWorkPerformer) {
    super(uowPerformer);
  }

  protected async _execute(
    _: void,
    uow: UnitOfWork,
    { siret }: EstablishmentJwtPayload,
  ) {
    const establishment = await uow.immersionOfferRepo.getEstablishmentForSiret(
      siret,
    );
    if (!establishment || establishment?.dataSource !== "form")
      throw new BadRequestError(
        `No establishment found with siret ${siret} and form data source. `,
      );

    const contact =
      await uow.immersionOfferRepo.getContactForEstablishmentSiret(siret);
    if (!contact) throw new BadRequestError("No contact ");

    const offers =
      await uow.immersionOfferRepo.getAnnotatedImmersionOffersForEstablishmentSiret(
        siret,
      );

    const retrievedForm: FormEstablishmentDto = {
      siret,
      source: "immersion-facile",
      businessName: establishment.name,
      businessNameCustomized: establishment.customizedName,
      businessAddress: establishment.address,
      isEngagedEnterprise: establishment.isCommited,
      naf: establishment?.nafDto,
      professions: offers.map((offer) => ({
        description: offer.romeLabel, // Libelle de l'appelation ou du code rome
        romeCodeMetier: offer.romeCode,
        romeCodeAppellation: offer.romeAppellation?.toString(), // possibly undefined ?
      })),
      businessContacts: [
        {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          job: contact.job,
          phone: contact.phone,
        },
      ],
      preferredContactMethods: [contact.contactMethod],
    };
    return retrievedForm;
  }
}
