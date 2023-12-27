import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { RealTimeGateway } from "../../secondary/core/TimeGateway/RealTimeGateway";
import { UuidV4Generator } from "../../secondary/core/UuidGeneratorImplementations";
import { AppConfig } from "../config/appConfig";
import { createAppDependencies } from "../config/createAppDependencies";

const INSERT_COUNT = 5000;

/* eslint-disable no-console */
const insertOutboxData = async () => {
  const config = AppConfig.createFromEnv();
  const deps = await createAppDependencies(config);

  const pool = deps.getPgPoolFn();
  const client = await pool.connect();

  const timeGateway = new RealTimeGateway();
  const uuidGenerator = new UuidV4Generator();

  await deps.uowPerformer.perform(async (uow) => {
    for (let i = 0; i < INSERT_COUNT; i++) {
      const createNewEvent = makeCreateNewEvent({
        uuidGenerator,
        timeGateway,
      });
      const event = createNewEvent({
        topic: "ApiConsumerSaved",
        payload: { consumerId: "99a59aba-59af-4481-9ebe-34b01b81746d" },
      });
      await uow.outboxRepository.save(event);
    }
  });

  client.release();
  await pool.end();
};

insertOutboxData()
  .then(() => {
    console.log("insertOutboxData script ended !");
  })
  .catch((err) => {
    console.error("Something went wrong with insertOutboxData script : ", err);
    process.exit(1);
  });
