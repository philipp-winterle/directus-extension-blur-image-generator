import type { Logger } from 'pino';
import { generateHashByKey } from './generate_hash_by_key';
import { FIELD_IMG_HASH } from '../meta/fields';
import type { HashAlgorithm } from '../types';

const FIELD_IMG_HASH_NAME = FIELD_IMG_HASH.field;

/**
 * Regenerates hashes for all image files that don't have a hash
 * @param itemsService - The items service instance
 * @param assetsService - The assets service instance
 * @param logger - The logger instance
 * @param hashAlgorithm - The hash algorithm to use (thumbhash or blurhash)
 */
export async function regenerate_hashs(
  itemsService: any,
  assetsService: any,
  logger: Logger,
  hashAlgorithm: HashAlgorithm = 'thumbhash',
  force = false
) {
  logger.info(`Regenerating hashes${force ? " forced" : ""}...`);

  const filter = {
    _and: [
      {
        type: {
          _starts_with: "image/",
        }
      },
      {
        type: {
          _ncontains: "svg",
        }
      },
    ],
    [FIELD_IMG_HASH_NAME]: {
      _empty: true,
    },
  };

  if (force) {
    delete filter[FIELD_IMG_HASH_NAME];
  }

  const files = await itemsService.readByQuery({
    fields: ["id"], // Specifying that only the 'id' field is needed from each record.
    filter: filter,
    limit: -1,
  });

  logger.info(`Total files to regenerate: ${files.length}`);

  for (const file of files) {
    try {
      const blurHash: string = await generateHashByKey({
        assetsService,
        key: file["id"],
        hashAlgorithm
      });

      const updateData = {
        [FIELD_IMG_HASH_NAME]: blurHash
      };

      await itemsService.updateOne(file["id"], updateData);
      logger.info(`Generated Hash [${file["id"]}]`);
    } catch (error) {
      logger.error(
        `Regeneration Error [${file["id"]}]: ${error}`,
      );
    }
  }
}
