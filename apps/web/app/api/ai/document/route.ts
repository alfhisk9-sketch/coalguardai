import { NextRequest, NextResponse } from "next/server";
import { documentAnalysisInputSchema } from "@sih/validation";
import { getAuthContext } from "../../../../lib/auth-context";
import { assertPermission } from "../../../../lib/authz";
import { SupabaseDb } from "../../../../lib/db/supabase";
import { getSupabaseServerClient } from "../../../../lib/supabase-client";
import { getAIService, getOCRService } from "../../../../lib/ai/service";
import { toErrorResponse } from "../../../../lib/errors";

export async function POST(req: NextRequest) {
  try {
    const ctx = await getAuthContext();
    assertPermission(ctx, "ai.view");

    const body = documentAnalysisInputSchema.parse(await req.json());
    const db = new SupabaseDb(getSupabaseServerClient());
    const ocr = getOCRService(db);
    const ai = getAIService(db);

    const [ocrText, classification, analysis] = await Promise.all([
      ocr.extractText({ documentId: body.documentId }),
      ocr.classifyDocument({ documentId: body.documentId }),
      ai.analyzeDocument(body),
    ]);

    return NextResponse.json({
      data: {
        extractedText: ocrText.text || analysis.extractedText,
        classification: classification.documentType || analysis.classification,
        confidence: ocrText.confidence,
        isSimulated: analysis.isSimulated,
        modelVersion: analysis.modelVersion,
      },
    });
  } catch (err) {
    return toErrorResponse(err);
  }
}
