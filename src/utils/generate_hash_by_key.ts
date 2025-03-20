import { buffer } from 'node:stream/consumers';
import * as ThumbHash from 'thumbhash';
import { encode } from 'blurhash';
import type { AssetsService, HashAlgorithm } from '../types.d.ts';
import { Jimp } from 'jimp';

const HEIGHT = 50;
const WIDTH = 50;

/**
 * Generates a hash for an image using the specified algorithm
 * @param assetsService - The assets service instance
 * @param key - The file key
 * @param hashAlgorithm - The hash algorithm to use (thumbhash or blurhash)
 * @returns The generated hash as a string
 */
export const generateHashByKey = async({
  assetsService, key, hashAlgorithm = 'thumbhash'
}: {
  assetsService: AssetsService,
  key: string,
  hashAlgorithm?: HashAlgorithm
}) => {
  const {
    stream
  } = await assetsService.getAsset(key, {
    transformationParams: {
      width: WIDTH,
      height: HEIGHT,
      fit: 'fill',
      withoutEnlargement: true,
      quality: 70,
      format: "jpeg",
      transforms: [
        [
          "ensureAlpha",
          1
        ]
      ]
    }
  });

  // Read the binary data from the Readable stream into a Buffer
  const imageBuffer = await buffer(stream);

  const img = await Jimp.read(imageBuffer);

  const data = img.bitmap.data;
  const width = img.bitmap.width;
  const height = img.bitmap.height;

  // console.log(pixelData);

  if (hashAlgorithm === 'blurhash') {
    // Use blurhash to generate a thumbnail
    const dataArray = new Uint8ClampedArray(data);
    const blurHash = encode(dataArray, width, height, 4, 3);

    return blurHash;
  } else {
    // Use thumbhash (default)
    const binaryThumbHash = ThumbHash.rgbaToThumbHash(width, height, data);
    const base64ThumbHash = Buffer.from(binaryThumbHash).toString('base64');

    return base64ThumbHash;
  }
};
