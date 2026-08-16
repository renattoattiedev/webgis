import { Config } from '../../enterprise/entities/config';

export abstract class ConfigRepository {
  abstract findById(COD_CONFIG_ID: string): Promise<Config | null>;
  abstract findKey(DSC_KEY: string): Promise<Config | null>;
  abstract findManyKeys(): Promise<Config[]>;
  abstract save(config: Config): Promise<void>;
}
