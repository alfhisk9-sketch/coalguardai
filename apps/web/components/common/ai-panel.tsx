"use client";

import * as React from "react";
import { Sparkles, AlertTriangle, ShieldCheck, RefreshCw, CheckCircle2, ArrowRight } from "lucide-react";
import type {
  ComplianceRiskResult,
  AnomalyDetectionResult,
  MineSummaryResult,
  InspectionAnalysisResult,
  DocumentAnalysisResult,
} from "@sih/types";
import { aiApi } from "../../lib/api/ai";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

export interface AiPanelProps {
  title?: string;
  mineId?: string;
  inspectionId?: string;
  documentId?: string;
  mode?: "risk" | "anomaly" | "summary" | "inspection" | "document" | "auto";
  className?: string;
  onFlaggedObservations?: (ids: string[]) => void;
}

export function AiPanel({
  title = "AI Risk & Safety Intelligence",
  mineId,
  inspectionId,
  documentId,
  mode = "auto",
  className,
  onFlaggedObservations,
}: AiPanelProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<"risk" | "anomaly" | "summary">("risk");

  const [riskData, setRiskData] = React.useState<ComplianceRiskResult | null>(null);
  const [anomalyData, setAnomalyData] = React.useState<AnomalyDetectionResult | null>(null);
  const [summaryData, setSummaryData] = React.useState<MineSummaryResult | null>(null);
  const [inspectionData, setInspectionData] = React.useState<InspectionAnalysisResult | null>(null);
  const [docData, setDocData] = React.useState<DocumentAnalysisResult | null>(null);

  const fetchAiData = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (inspectionId) {
        const res = await aiApi.analyzeInspection(inspectionId);
        setInspectionData(res.data);
        if (onFlaggedObservations && res.data.flaggedObservationIds) {
          onFlaggedObservations(res.data.flaggedObservationIds);
        }
      } else if (documentId) {
        const res = await aiApi.analyzeDocument(documentId);
        setDocData(res.data);
      } else if (mineId) {
        const [rRes, aRes, sRes] = await Promise.all([
          aiApi.analyzeRisk(mineId).catch(() => null),
          aiApi.detectAnomaly(mineId).catch(() => null),
          aiApi.summarizeMine(mineId).catch(() => null),
        ]);
        if (rRes) setRiskData(rRes.data);
        if (aRes) setAnomalyData(aRes.data);
        if (sRes) setSummaryData(sRes.data);
      } else {
        // Org-level / Demo default: analyze demo mine if no mineId specified
        const rRes = await aiApi.analyzeRisk("mine-1").catch(() => null);
        if (rRes) setRiskData(rRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI analysis unavailable.");
    } finally {
      setLoading(false);
    }
  }, [mineId, inspectionId, documentId, onFlaggedObservations]);

  React.useEffect(() => {
    fetchAiData();
  }, [fetchAiData]);

  // Determine which model version and simulated flag to display
  const currentResult = inspectionData || docData || riskData || summaryData || anomalyData;
  const isSimulated = currentResult?.isSimulated ?? true;
  const modelVersion = currentResult?.modelVersion ?? "coalguard-rules-v2.1-deterministic";

  return (
    <Card className={className} id="ai-intelligence-panel">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent animate-pulse" aria-hidden="true" />
            {title}
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <Badge
              variant={isSimulated ? "warning" : "success"}
              className="text-[10px] px-1.5 py-0.5"
            >
              {isSimulated ? "Simulated Demo AI" : `Gemini AI (${modelVersion})`}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={fetchAiData}
              disabled={loading}
              title="Refresh AI Analysis"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 pt-1">
        {loading ? (
          <div className="space-y-2 py-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Synthesizing governance signals and risk telemetry…</span>
            </div>
            <div className="h-2 w-full animate-pulse rounded bg-secondary" />
            <div className="h-2 w-3/4 animate-pulse rounded bg-secondary" />
          </div>
        ) : error ? (
          <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive">
            <p className="font-medium">AI Analysis Notice</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchAiData} className="mt-2 h-7 text-xs">
              Retry Analysis
            </Button>
          </div>
        ) : inspectionData ? (
          // --- Inspection Analysis View ---
          <div className="space-y-3">
            <p className="text-xs leading-relaxed text-foreground/90">{inspectionData.summary}</p>
            <div className="rounded-md bg-secondary/60 p-2.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span>Flagged Observations:</span>
                <Badge
                  variant={inspectionData.flaggedObservationIds.length > 0 ? "destructive" : "success"}
                >
                  {inspectionData.flaggedObservationIds.length} flagged
                </Badge>
              </div>
              {inspectionData.flaggedObservationIds.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {inspectionData.flaggedObservationIds.map((id) => (
                    <span
                      key={id}
                      className="rounded bg-destructive/10 px-1.5 py-0.5 font-mono text-[10px] text-destructive"
                    >
                      {id.slice(0, 8)}…
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">
                  No critical safety hazards flagged for immediate escalation.
                </p>
              )}
            </div>
          </div>
        ) : docData ? (
          // --- Document Analysis View ---
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Detected Classification:</span>
              <Badge variant="outline">{docData.classification ?? "General Document"}</Badge>
            </div>
            <div className="rounded-md bg-secondary/50 p-2 font-mono text-[11px] text-foreground/80 whitespace-pre-line max-h-36 overflow-y-auto">
              {docData.extractedText}
            </div>
          </div>
        ) : mineId || riskData ? (
          // --- Mine Risk, Anomaly & Summary Tabs View ---
          <div className="space-y-3">
            {mineId && (
              <div className="flex rounded-md bg-secondary/80 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setActiveTab("risk")}
                  className={`flex-1 rounded py-1 text-center transition-colors ${
                    activeTab === "risk" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Risk Score
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("anomaly")}
                  className={`flex-1 rounded py-1 text-center transition-colors ${
                    activeTab === "anomaly" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Anomalies
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("summary")}
                  className={`flex-1 rounded py-1 text-center transition-colors ${
                    activeTab === "summary" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Summary
                </button>
              </div>
            )}

            {activeTab === "risk" && riskData && (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/30">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      AI Risk Index
                    </span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold tracking-tight">{riskData.score}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      riskData.riskLevel === "CRITICAL"
                        ? "destructive"
                        : riskData.riskLevel === "HIGH"
                        ? "warning"
                        : riskData.riskLevel === "MEDIUM"
                        ? "outline"
                        : "success"
                    }
                    className="text-xs font-semibold px-2.5 py-1"
                  >
                    {riskData.riskLevel} RISK
                  </Badge>
                </div>

                {/* Factors Breakdown */}
                {riskData.factors && riskData.factors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-medium text-muted-foreground">Primary Contributing Factors</p>
                    {riskData.factors.map((f, i) => (
                      <div key={i} className="space-y-0.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="truncate pr-2">{f.label}</span>
                          <span className="font-mono text-muted-foreground">{f.weight} pts</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${Math.min(100, (f.weight / 40) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommended Actions */}
                {riskData.recommendedActions && riskData.recommendedActions.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-[11px] font-medium text-muted-foreground">Recommended Actions</p>
                    <ul className="space-y-1 text-xs">
                      {riskData.recommendedActions.slice(0, 3).map((act, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-foreground/90">
                          <ArrowRight className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          <span className="text-[11px] leading-tight">{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === "anomaly" && (
              <div className="space-y-2">
                {anomalyData && anomalyData.anomalies && anomalyData.anomalies.length > 0 ? (
                  anomalyData.anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="rounded-md border border-border/80 bg-secondary/30 p-2.5 text-xs"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1">
                          <p className="leading-snug text-foreground/90">{anom.description}</p>
                          <span className="text-[10px] text-muted-foreground">
                            Confidence: {Math.round(anom.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-2 rounded-md bg-secondary/40 p-3 text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-success shrink-0" />
                    <span>Operational parameters within normal baseline.</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === "summary" && (
              <div className="space-y-2">
                {summaryData ? (
                  <p className="text-xs leading-relaxed text-foreground/90 bg-secondary/40 rounded-md p-3">
                    {summaryData.summary}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No executive summary available.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Select an authorized mine to initiate real-time AI compliance and risk telemetry.
          </p>
        )}

        <div className="border-t border-border/60 pt-2">
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            AI decision-support indicator. Not an official statutory regulatory rating.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
