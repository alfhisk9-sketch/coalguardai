import type { AIService, OCRService } from "@sih/types";
import type { Db } from "../db/types";
import { GeminiAIService } from "./gemini";
import { StubAIService } from "./stub";
import { CoalGuardOCRService } from "./ocr";

let aiServiceInstance: AIService | null = null;
let ocrServiceInstance: OCRService | null = null;

/**
 * Returns the active AIService implementation.
 * Defaults to GeminiAIService (which falls back automatically to StubAIService
 * if GEMINI_API_KEY is missing, GEMINI_ENABLED=false, or offline).
 */
export function getAIService(db: Db): AIService {
  // Always initialize with the provided Db instance
  return new GeminiAIService(db);
}

/**
 * Returns the active OCRService implementation.
 */
export function getOCRService(db: Db): OCRService {
  return new CoalGuardOCRService(db);
}
