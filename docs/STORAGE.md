# STORAGE.md

## Buckets (Supabase Storage, all private)

| Bucket | Purpose | Path convention |
|---|---|---|
| `compliance-evidence` | Compliance record evidence | `{mineId}/{recordId}/{filename}` |
| `inspection-evidence` | Inspection/observation photos | `{mineId}/{inspectionId}/{filename}` |
| `incident-evidence` | Incident evidence | `{mineId}/{incidentId}/{filename}` |
| `contractor-documents` | Contractor/worker docs | `{contractorId}/{filename}` |
| `environmental-evidence` | Environmental reading evidence | `{mineId}/{pointId}/{filename}` |
| `grievance-evidence` | Grievance attachments | `{grievanceId}/{filename}` (confidential) |

## Access Pattern
1. Client requests upload → API route checks `documents.upload` (+ ownership where relevant) → returns a signed upload URL.
2. File uploaded directly to Supabase Storage from client using the signed URL (keeps large files off the Next.js server).
3. API route inserts a `documents` row (`storage_path`, `owner_type`, `owner_id`, `mime_type`, `processing_status = 'NONE'`).
4. Reads: client requests a file → API checks permission/ownership → returns a short-lived signed **download** URL. Storage paths are never exposed as public URLs.

## OCR Hook
`documents.processing_status` and `documents.extracted_text`/`ocr_result` columns exist so Account 3's `OCRService` can update them asynchronously without schema changes. Account 1 does not call OCR — it only prepares the data model.

## Retention & Versioning
`document_versions` table supports re-upload of a corrected file without losing history. No automatic deletion in the prototype; soft-delete only (`documents.deleted_at`), consistent with audit requirements.

## Size/Type Limits
Enforced client-side (Account 2 UI) and re-validated server-side in the API route (max size + allowed MIME types per bucket) before issuing a signed upload URL — never trust client-side limits alone.
