import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

// ----- constants --------------------------------------------------
const DEFAULT_MODEL = "Xenova/all-MiniLM-L6-v2";

// ----- lazy singleton ----------------------------------------------
let _extractor: FeatureExtractionPipeline | null = null;

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!_extractor) {
    _extractor = await pipeline("feature-extraction", DEFAULT_MODEL);
  }
  return _extractor;
}

// ----- public API --------------------------------------------------
/** The model name used for embeddings (also stored as `model_version`). */
export function modelVersion(): string {
  return DEFAULT_MODEL;
}

/**
 * Generate a 384-dimensional embedding vector for a single text.
 * The model is loaded lazily on the first call.
 */
export async function embed(text: string): Promise<number[]>;

/**
 * Generate 384-dimensional embedding vectors for multiple texts in
 * a single batch (more efficient than calling `embed` in a loop).
 * The model is loaded lazily on the first call.
 */
export async function embed(texts: string[]): Promise<number[][]>;

export async function embed(input: string | string[]): Promise<number[] | number[][]> {
  const extractor = await getExtractor();
  const result = await extractor(input, {
    pooling: "mean",
    normalize: true,
  });

  // tolist() returns nested arrays matching the tensor dims:
  //   [1, 384]  →  [[...384 values]]
  //   [N, 384]  →  [[...384], [...384], ...]
  const list: number[][] = result.tolist() as number[][];
  return Array.isArray(input) ? list : list[0]!;
}
