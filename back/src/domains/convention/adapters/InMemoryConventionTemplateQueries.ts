import type {
  ConventionTemplate,
  ConventionTemplateId,
  DateTimeIsoString,
} from "shared";
import type {
  ConventionTemplateQueries,
  GetConventionTemplatesParams,
} from "../ports/ConventionTemplateQueries";

export class InMemoryConventionTemplateQueries
  implements ConventionTemplateQueries
{
  #conventionTemplates: Record<ConventionTemplateId, ConventionTemplate> = {};

  public set conventionTemplates(templates: ConventionTemplate[]) {
    this.#conventionTemplates = templates.reduce(
      (acc, template) => ({
        ...acc,
        [template.id]: template,
      }),
      {},
    );
  }

  public get conventionTemplates(): ConventionTemplate[] {
    return Object.values(this.#conventionTemplates);
  }

  public async get(
    params: GetConventionTemplatesParams,
  ): Promise<ConventionTemplate[]> {
    return this.conventionTemplates.filter(
      (t) =>
        (!params.ids?.length || params.ids.includes(t.id)) &&
        (!params.userIds?.length || params.userIds.includes(t.userId)),
    );
  }

  public async upsert(
    conventionTemplate: ConventionTemplate,
    _now: DateTimeIsoString,
  ): Promise<void> {
    this.#conventionTemplates[conventionTemplate.id] = conventionTemplate;
  }

  public async delete(
    conventionTemplateId: ConventionTemplateId,
  ): Promise<ConventionTemplateId | null> {
    const conventionTemplate = this.#conventionTemplates[conventionTemplateId];
    if (!conventionTemplate) return null;

    delete this.#conventionTemplates[conventionTemplateId];
    return conventionTemplateId;
  }
}
