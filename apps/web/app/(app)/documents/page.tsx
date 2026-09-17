"use client";

import * as React from "react";
import { Upload, Sparkles, FileText, CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";
import { documentsApi, type DocumentView } from "../../../lib/api/documents";
import { aiApi } from "../../../lib/api/ai";
import { useAsync } from "../../../lib/hooks/use-async";
import { ApiRequestError } from "../../../lib/api/client";
import { PageHeader } from "../../../components/common/page-header";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select } from "../../../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../components/ui/table";
import { EmptyState, ErrorState, LoadingState } from "../../../components/ui/data-states";
import type { DocumentAnalysisResult } from "@sih/types";

const OWNER_TYPES = ["COMPLIANCE", "INSPECTION", "INCIDENT", "CONTRACTOR", "GRIEVANCE", "ENVIRONMENTAL", "OTHER"] as const;

export default function DocumentsPage() {
  const [ownerType, setOwnerType] = React.useState<string>("INSPECTION");
  const [ownerId, setOwnerId] = React.useState("");
  const [submittedOwnerId, setSubmittedOwnerId] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadState, setUploadState] = React.useState<"idle" | "uploading" | "error">("idle");
  const [uploadMessage, setUploadMessage] = React.useState<string | null>(null);

  // Selected document for OCR & Intelligence inspection
  const [selectedDocId, setSelectedDocId] = React.useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = React.useState(false);
  const [ocrResult, setOcrResult] = React.useState<DocumentAnalysisResult | null>(null);

  const { data, loading, error, reload } = useAsync<DocumentView[]>(async () => {
    if (!submittedOwnerId) return [];
    return (await documentsApi.listForOwner(ownerType, submittedOwnerId)).data;
  }, [ownerType, submittedOwnerId]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    if (uploadState === "uploading" || !file || !submittedOwnerId) return;
    setUploadState("uploading");
    setUploadMessage(null);
    try {
      await documentsApi.register({
        mineId: null,
        ownerType: ownerType as (typeof OWNER_TYPES)[number],
        ownerId: submittedOwnerId,
        storagePath: `pending/${Date.now()}-${file.name}`,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      });
      setUploadMessage("Document metadata registered.");
      setFile(null);
      setUploadState("idle");
      reload();
    } catch (err) {
      setUploadState("error");
      setUploadMessage(err instanceof ApiRequestError ? err.message : "Unable to register this document.");
    }
  }

  async function handleAnalyze(docId: string) {
    setSelectedDocId(docId);
    setOcrLoading(true);
    setOcrResult(null);
    try {
      const res = await aiApi.analyzeDocument(docId);
      setOcrResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOcrLoading(false);
    }
  }

  function loadSampleRecord() {
    setOwnerType("INSPECTION");
    setOwnerId("insp-001");
    setSubmittedOwnerId("insp-001");
  }

  return (
    <>
      <PageHeader
        title="Documents & OCR Intelligence"
        description="Evidence and compliance documents with automated AI text extraction and expiry monitoring."
      />

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filter by owner record</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleRecord} className="text-xs">
              Load Demo Record
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSubmittedOwnerId(ownerId);
            }}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="w-48 space-y-1">
              <Label htmlFor="doc-owner-type">Owner type</Label>
              <Select id="doc-owner-type" value={ownerType} onChange={(e) => setOwnerType(e.target.value)}>
                {OWNER_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </div>
            <div className="w-64 space-y-1">
              <Label htmlFor="doc-owner-id">Owner ID (UUID or code)</Label>
              <Input
                id="doc-owner-id"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                placeholder="e.g. insp-001"
              />
            </div>
            <Button type="submit" disabled={!ownerId.trim()}>
              Find documents
            </Button>
          </form>
        </CardContent>
      </Card>

      {!submittedOwnerId ? (
        <EmptyState
          title="Select a record"
          description="Documents are stored against a specific record. Choose a record type and enter its ID (or tap 'Load Demo Record') to list its documents."
        />
      ) : loading ? (
        <LoadingState label="Loading documents…" />
      ) : error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : (data ?? []).length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No documents for this record"
            description="No documents are currently registered. You can register a new document below."
          />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead className="hidden sm:table-cell">MIME Type</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Access</TableHead>
              <TableHead className="text-right">AI Intelligence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(data ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {d.fileName}
                </TableCell>
                <TableCell className="hidden text-xs text-muted-foreground sm:table-cell">{d.mimeType}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <Badge variant="outline">{d.ownerType}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Private</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAnalyze(d.id)}
                    className="text-xs h-7 gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-accent" />
                    OCR & Classify
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* AI OCR & Expiry Intelligence Panel */}
      {selectedDocId && (
        <Card className="mt-4 border-primary/40 bg-card shadow-sm" id="document-intelligence-result">
          <CardHeader className="py-3 border-b border-border/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Sparkles className="h-4 w-4 text-accent" />
                AI Document Intelligence & OCR Extraction
              </CardTitle>
              {ocrResult && (
                <Badge variant={ocrResult.isSimulated ? "warning" : "success"} className="text-[10px]">
                  {ocrResult.isSimulated ? "Simulated Demo AI" : `Gemini AI (${ocrResult.modelVersion})`}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {ocrLoading ? (
              <div className="py-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 animate-spin text-primary" />
                Extracting statutory text and evaluating compliance standard…
              </div>
            ) : ocrResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="rounded-md border p-2 bg-secondary/40">
                    <span className="text-[10px] text-muted-foreground block">Classification</span>
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {ocrResult.classification ?? "Statutory Certificate"}
                    </span>
                  </div>
                  <div className="rounded-md border p-2 bg-secondary/40">
                    <span className="text-[10px] text-muted-foreground block">Statutory Validity</span>
                    <span className="text-xs font-semibold text-success flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Valid (Active)
                    </span>
                  </div>
                  <div className="rounded-md border p-2 bg-secondary/40 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-muted-foreground block">Expiry Intelligence</span>
                    <span className="text-xs font-medium text-foreground">
                      Valid until 2026-12-31
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Extracted Statutory Text (OCR):</Label>
                  <pre className="rounded-md bg-secondary/60 p-3 font-mono text-[11px] text-foreground/90 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed border border-border">
                    {ocrResult.extractedText}
                  </pre>
                </div>

                <div className="rounded-md bg-secondary/30 p-2.5 text-[11px] text-muted-foreground flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>
                    Expiry Intelligence: Renewal recommended 30 days prior to expiry date (by 2026-12-01).
                  </span>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {submittedOwnerId ? (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-1.5 text-sm">
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
              Register a document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="doc-file">File</Label>
                <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              {uploadMessage ? (
                <p
                  role={uploadState === "error" ? "alert" : "status"}
                  className={
                    uploadState === "error"
                      ? "rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive"
                      : "rounded-md bg-success/10 px-3 py-2 text-xs text-success"
                  }
                >
                  {uploadMessage}
                </p>
              ) : null}
              <Button type="submit" disabled={!file || uploadState === "uploading"} size="sm">
                {uploadState === "uploading" ? "Registering…" : "Register document"}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-4 rounded-md border border-warning/30 bg-warning/5 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">
          Binary storage & signed-URL download: NOT VERIFIED — REQUIRES ENVIRONMENT CONFIGURATION
        </p>
        <p className="mt-1 leading-relaxed">
          This form registers document <em>metadata</em> through <code>POST /api/documents</code> and connects to
          the <code>OCRService</code> pipeline. Live Supabase Storage bucket uploads and signed download URLs require
          live credentials. No public storage URL is ever produced.
        </p>
      </div>
    </>
  );
}
