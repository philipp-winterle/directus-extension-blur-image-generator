import type { Readable } from 'node:stream';
import type { ResizeOptions, Sharp } from 'sharp';
import type { Range, Stat } from '@directus/storage';
export type HashAlgorithm = 'thumbhash' | 'blurhash';

// Directus Types - unfortunately not exported
export const TransformationMethods /* : readonly (keyof Sharp)[]*/ = [
  // Output options
  // https://sharp.pixelplumbing.com/api-output
  'toFormat',
  'jpeg',
  'png',
  'tiff',
  'webp',
  'avif',

  // Resizing
  // https://sharp.pixelplumbing.com/api-resize
  'resize',
  'extend',
  'extract',
  'trim',

  // Image operations
  // https://sharp.pixelplumbing.com/api-operation
  'rotate',
  'flip',
  'flop',
  'sharpen',
  'median',
  'blur',
  'flatten',
  'gamma',
  'negate',
  'normalise',
  'normalize',
  'clahe',
  'convolve',
  'threshold',
  'linear',
  'recomb',
  'modulate',

  // Color manipulation
  // https://sharp.pixelplumbing.com/api-colour
  'tint',
  'greyscale',
  'grayscale',
  'toColorspace',
  'toColourspace',

  // Channel manipulation
  // https://sharp.pixelplumbing.com/api-channel
  'removeAlpha',
  'ensureAlpha',
  'extractChannel',
  'bandbool',
] as const;

// Helper types
type AllowedSharpMethods = Pick<Sharp, (typeof TransformationMethods)[number]>;

export type TransformationMap = {
	[M in keyof AllowedSharpMethods]: readonly [M, ...Parameters<AllowedSharpMethods[M]>];
};

export type Transformation = TransformationMap[keyof TransformationMap];

export type TransformationResize = Pick<ResizeOptions, 'width' | 'height' | 'fit' | 'withoutEnlargement'>;

export type TransformationFormat = 'jpg' | 'jpeg' | 'png' | 'webp' | 'tiff' | 'avif';

export type TransformationParams = {
	key?: string;
	transforms?: Transformation[];
	format?: TransformationFormat | 'auto';
	quality?: number;
	focal_point_x?: number;
	focal_point_y?: number;
} & TransformationResize;

export interface TransformationSet {
	transformationParams: TransformationParams;
	acceptFormat?: TransformationFormat | undefined;
}

interface AssetsService {
    getAsset: (id: string, transformation: TransformationSet, range?: Range, deferStream?: boolean) => Promise<{
    stream: Readable;
    file: any;
    stat: Stat;
  }>;
}
