import type { HashAlgorithm } from './types';
import { defineHook } from '@directus/extensions-sdk';
import ansis from 'ansis';
import packageJson from '../package.json' assert { type: 'json' };
import { addFilesFields, addSettingsFields } from './utils/migration';
import { Logger } from 'pino';
import { generateHashByKey } from './utils/generate_hash_by_key';
import { regenerate_hashs } from './utils/regenerate_hashs';

const EXTENSION_NAME = ansis.fg(135)(`[ ${packageJson.name.replaceAll("-", " ").toUpperCase()} ] `);

export default defineHook(async(register, context) => {
  const { action, init } = register;
  const {
    services, database, getSchema, logger: baseLogger
  } = context;
  const {
    AssetsService, FieldsService, ItemsService
  } = services;

  const logger = baseLogger.child({}, {
    msgPrefix: EXTENSION_NAME
  }) as Logger;

  const fieldsService = new FieldsService({
    knex: database,
    schema: await getSchema(),
  });

  // Add the settings fields if they don't exist
  let currentAlgorithm = await addSettingsFields({
    database,
    fieldsService,
    logger
  });

  logger.info(ansis.yellowBright(`Current Hash algorithm: ${currentAlgorithm}`));

  // Validate existing fields
  init("routes.custom.after", async(_meta) => {
    logger.info("Validating existing fields...");

    const assetsService = new AssetsService({
      knex: database,
      schema: await getSchema(),
    });

    // Validate existing fields
    await addFilesFields({
      database,
      fieldsService,
      logger
    });

    const itemsService = new ItemsService("directus_files", {
      knex: database,
      schema: await getSchema(),
    });

    // Regenerate all images if needed
    await regenerate_hashs(itemsService, assetsService, logger, currentAlgorithm);

    logger.info(ansis.greenBright('👍🏻  Blur Image Generator is ready to go!'));
  });

  action('files.upload', async(meta, context) => {
    const { payload, key } = meta;
    const { accountability } = context;

    if (!payload.type.includes('image/')) {
      return;
    }

    try {
      // Get the current hash algorithm setting
      const settings = await context.database('directus_settings').first('blur_image_generator');
      const hashAlgorithm = settings?.blur_image_generator || 'thumbhash';

      const assetsService = new AssetsService({
        schema: await getSchema(),
        accountability: accountability
      });

      const base64Hash = await generateHashByKey({
        assetsService,
        key,
        hashAlgorithm
      });

      // Update the file record with the preview image
      await context.database('directus_files')
        .update({
          blur_img_hash: base64Hash,
        })
        .where({ id: key });

      logger.info(ansis.greenBright(`Successfully generated preview image for:  ${key}`));
    } catch (error) {
      if (error instanceof Error) {
        logger.info(ansis.redBright('Error generating blur image hash:'));
        logger.error(error);
      }
    }
  });

  // Event for setting change
  action('settings.update', async(meta, context) => {
    const { payload } = meta;
    const { accountability } = context;
    const { blur_image_generator } = payload;

    // Validate the algorithm
    if (!["blurhash", "thumbhash"].includes(blur_image_generator)) {
      return;
    }
    const algorithm: HashAlgorithm = blur_image_generator;

    // If the algorithm is the same, do nothing
    if (currentAlgorithm === algorithm) {
      return;
    }

    const itemsService = new ItemsService("directus_files", {
      knex: database,
      schema: await getSchema(),
      accountability
    });

    const assetsService = new AssetsService({
      schema: await getSchema(),
      accountability
    });

    // Regenerate all images on selection of a new algorithm
    await regenerate_hashs(itemsService, assetsService, logger, algorithm, true);

    currentAlgorithm = algorithm;
  });
});
