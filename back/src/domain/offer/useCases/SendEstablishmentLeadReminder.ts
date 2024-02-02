import {z} from "zod";
import {
  AbsoluteUrl,
  castError,
  ConventionId,
  ConventionReadDto,
  frontRoutes,
  immersionFacileNoReplyEmailSender,
  SiretDto
} from "shared";
import {AppConfig} from "../../../adapters/primary/config/appConfig";
import {CreateNewEvent} from "../../core/eventBus/EventBus";
import {ShortLinkIdGeneratorGateway} from "../../core/ports/ShortLinkIdGeneratorGateway";
import {UnitOfWork, UnitOfWorkPerformer} from "../../core/ports/UnitOfWork";
import {makeShortLink} from "../../core/ShortLink";
import {TransactionalUseCase} from "../../core/UseCase";
import {SaveNotificationAndRelatedEvent} from "../../generic/notifications/entities/Notification";
import {EstablishmentLeadEventKind, establishmentLeadEventKind,} from "../entities/EstablishmentLeadEntity";

type SendEstablishmentLeadReminderOutput = {
  errors?: Record<SiretDto, Error>;
  establishmentsReminded: SiretDto[];
};

export class SendEstablishmentLeadReminder extends TransactionalUseCase<
  EstablishmentLeadEventKind,
  SendEstablishmentLeadReminderOutput
> {
  protected inputSchema = z.enum(establishmentLeadEventKind);

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #createNewEvent: CreateNewEvent;

  // readonly #timeGateway: TimeGateway;

  readonly #shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway;

  readonly #config: AppConfig;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    createNewEvent: CreateNewEvent,
    shortLinkIdGeneratorGateway: ShortLinkIdGeneratorGateway,
    config: AppConfig,
    // timeGateway: TimeGateway,
    ) {
    super(uowPerformer)
    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#shortLinkIdGeneratorGateway = shortLinkIdGeneratorGateway;
    this.#config = config;
    // this.#timeGateway = timeGateway;
  }

  protected async _execute(
    _kind: EstablishmentLeadEventKind,
    uow: UnitOfWork,
  ): Promise<SendEstablishmentLeadReminderOutput> {
    const conventions =
      await uow.establishmentLeadQueries.getLastConventionsByLastEventKind(
        "to-be-reminded",
      );
      
      const errors: Record<ConventionId, Error> = {};
      await Promise.all(
        conventions.map(async (convention) => {
          await this.#sendOneEmailWithEstablishmentLeadReminder(
            uow,
            this.#config,
            convention,
          ).catch((error) => {
            errors[convention.id] = castError(error);
          });
        }),
      );

    return Promise.resolve({
      establishmentsReminded: conventions.map(({ siret }) => siret),
      errors: {},
    });
  }

  async #sendOneEmailWithEstablishmentLeadReminder(
    uow: UnitOfWork,
    config: AppConfig,
    convention: ConventionReadDto,
  ) {
    const registrationLink = await makeShortLink({
      uow,
      shortLinkIdGeneratorGateway: this.#shortLinkIdGeneratorGateway,
      config: this.#config,
      longLink: generateAddEstablishmentFormLink({config,convention})
    })

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "ESTABLISHMENT_LEAD_REMINDER",
        recipients: [convention.signatories.establishmentRepresentative.email],
        sender: immersionFacileNoReplyEmailSender,
        params: {
          businessName: convention.businessName,
          registrationLink,
          rejectRegistrationLink: '',
        },
      },
      followedIds: {
        conventionId: convention.id,
        establishmentSiret: convention.siret,
      },
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "SendEstablishmentLeadReminder",
        payload: { id: convention.id },
      }),
    );
  }

}

const generateAddEstablishmentFormLink = ({config, convention}: { config: AppConfig, convention: ConventionReadDto }): AbsoluteUrl => `${config.immersionFacileBaseUrl}/${frontRoutes.establishment}?siret=${convention.siret}&bName=${convention.businessName}&bAdress=${convention.immersionAddress}&bcLastName=${convention.establishmentTutor.lastName}&bcFirstName=${convention.establishmentTutor.firstName}&bcPhone=${convention.establishmentTutor.phone}&bcEmail=${convention.establishmentTutor.email}`