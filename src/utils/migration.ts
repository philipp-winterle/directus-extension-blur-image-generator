import type { Logger } from 'pino';
import { FIELDS_TO_ADD, FIELD_HASH_ALGORITHM } from '../meta/fields';
import ansis from 'ansis';
import type { HashAlgorithm } from '../types';

export const validateExistingFields = async({
  database, fieldsService, logger
}: {
    database: any,
    fieldsService: any,
    logger: Logger
}) => {
  for (const field of FIELDS_TO_ADD) {
    try {
      // Check if the column exists in the directus_files table
      const hasColumn = await database.schema.hasColumn('directus_files', field.field);

      if (!hasColumn) {
        logger.info(ansis.yellowBright(`Blur Image Generator: Adding field ${field.field} to directus_files table...`));

        // Add the column to the directus_files table
        await fieldsService.createField('directus_files', field, undefined,{
          emitEvents: false
        });

        logger.info(ansis.greenBright(`✅  Field ${field.field} added to directus_files table`));
      }
    } catch (error) {
      logger.error(ansis.redBright(`Blur Image Generator Error while adding field ${field.field}:`));
      logger.error(error);
    }
  }
};

/**
 * Checks if the blur-image-generator settings exist and creates them if they don't
 * @param database - The database instance
 * @param fieldsService - The fields service instance
 * @param logger - The logger instance
 * @returns The current hash algorithm setting (thumbhash or blurhash)
 */
export const validateSettings = async({
  database, fieldsService, logger
}: {
  database: any,
  fieldsService: any,
  logger: Logger
}): Promise<HashAlgorithm> => {
  let hashAlgorithm: HashAlgorithm = 'thumbhash'; // Default to thumbhash

  try {
    // Check if the settings field exists
    const hasField = await database.schema.hasColumn('directus_settings', 'blur_image_generator');

    if (!hasField) {
      logger.info(ansis.yellowBright(`Adding blur-image-generator settings field to directus_settings table...`));

      // Add the field to the directus_settings table
      await fieldsService.createField('directus_settings', FIELD_HASH_ALGORITHM, undefined, {
        emitEvents: false
      });

      // Set the default value for the field
      await database('directus_settings')
        .update({
          blur_image_generator: hashAlgorithm
        })
        .where({ id: 1 });

      logger.info(ansis.greenBright(`✅  blur-image-generator settings field added to directus_settings table`));
    } else {
      // Get the current setting
      const settings = await database('directus_settings').first('blur_image_generator');

      if (settings && settings.blur_image_generator) {
        hashAlgorithm = settings.blur_image_generator;
      }
    }
  } catch (error) {
    logger.error(ansis.redBright(`Error while adding blur-image-generator settings field:`));
    logger.error(error);
  }

  return hashAlgorithm;
};
