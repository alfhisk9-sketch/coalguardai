"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bot,
  Send,
  Sparkles,
  RefreshCw,
  User,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "../../../components/common/page-header";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { aiApi } from "../../../lib/api/ai";
import { minesApi } from "../../../lib/api/mines";
import type { Mine, AISourceItem } from "@sih/types";

interface Message {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  sources?: AISourceItem[];
  grounded?: boolean;
  provider?: "gemini" | "unavailable";
  isUnavailable?: boolean;
}

const SUGGESTED_PROMPTS = [
  "Show high-risk mines",
  "Which inspections are overdue?",
  "Compare compliance across mines",
  "Summarize open incidents",
  "What corrective actions are overdue?",
  "Show today's safety alerts",
  "Analyze environmental risk",
  "Summarize production anomalies",
];

function getSourceHref(type?: string): string {
  if (!type) return "/dashboard";
  switch (type.toLowerCase()) {
    case "mines":
    case "mine_details":
    case "risk_scores":
      return "/mines";
    case "inspections":
      return "/inspections";
    case "incidents":
      return "/incidents";
    case "corrective_actions":
    case "capa":
      return "/corrective-actions";
    case "environmental":
      return "/environmental";
    case "compliance":
      return "/compliance";
    case "production":
      return "/production";
    default:
      return "/dashboard";
  }
}

/**
 * Lightweight enterprise markdown formatter for assistant responses.
 * Formats tables, bold text, bullet points, and code spans without external heavy dependencies.
 */
function FormattedAssistantText({ text }: { text: string }) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let tableBuffer: string[] = [];

  const flushTable = (keyPrefix: number) => {
    if (tableBuffer.length === 0) return;
    const headerLine = tableBuffer[0];
    if (!headerLine) return;
    const dataLines = tableBuffer.slice(2); // skip separator line (|---|---|)

    const parseRow = (line: string) =>
      line
        .split("|")
        .map((c) => c.trim())
        .filter((c, idx, arr) => (idx > 0 && idx < arr.length - 1) || arr.length <= 2);

    const headers = parseRow(headerLine);

    elements.push(
      <div key={`tbl-${keyPrefix}`} className="my-2.5 overflow-x-auto rounded-lg border border-border bg-slate-950/40">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-semibold text-foreground">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {dataLines.map((dLine, rIdx) => {
              const cells = parseRow(dLine);
              return (
                <tr key={rIdx} className="hover:bg-muted/20 transition-colors">
                  {cells.map((c, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-muted-foreground">
                      {formatInlineText(c)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    tableBuffer = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Markdown table row
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      tableBuffer.push(trimmed);
      return;
    } else if (tableBuffer.length > 0) {
      flushTable(idx);
    }

    if (!trimmed) {
      elements.push(<div key={`sp-${idx}`} className="h-2" />);
      return;
    }

    // Unordered bullet
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <li key={`li-${idx}`} className="ml-4 list-disc text-xs leading-relaxed text-slate-200">
          {formatInlineText(trimmed.slice(2))}
        </li>
      );
      return;
    }

    // Numbered list item
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch && numMatch[2]) {
      elements.push(
        <li key={`num-${idx}`} className="ml-4 list-decimal text-xs leading-relaxed text-slate-200">
          {formatInlineText(numMatch[2])}
        </li>
      );
      return;
    }

    // Heading (### or ##)
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={`h4-${idx}`} className="font-bold text-xs text-foreground mt-2 mb-1">
          {trimmed.replace(/^###\s+/, "")}
        </h4>
      );
      return;
    }
    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={`h3-${idx}`} className="font-bold text-sm text-foreground mt-2.5 mb-1">
          {trimmed.replace(/^##\s+/, "")}
        </h3>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-xs leading-relaxed text-slate-200">
        {formatInlineText(trimmed)}
      </p>
    );
  });

  if (tableBuffer.length > 0) {
    flushTable(lines.length);
  }

  return <div className="space-y-1">{elements}</div>;
}

function formatInlineText(text: string): React.ReactNode {
  // Highlights bold (**text**), inline code (`code`), and key risk badges
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      if (inner === "CRITICAL" || inner === "HIGH") {
        return (
          <span key={i} className="font-bold text-rose-400 bg-rose-500/10 px-1 py-0.5 rounded border border-rose-500/20">
            {inner}
          </span>
        );
      }
      if (inner === "OVERDUE" || inner === "NON_COMPLIANT") {
        return (
          <span key={i} className="font-bold text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded border border-amber-500/20">
            {inner}
          </span>
        );
      }
      if (inner === "COMPLIANT" || inner === "LOW") {
        return (
          <span key={i} className="font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">
            {inner}
          </span>
        );
      }
      return (
        <strong key={i} className="font-semibold text-white">
          {inner}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-slate-800/80 px-1.5 py-0.5 font-mono text-[11px] text-amber-300 border border-slate-700/50">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function AssistantPage() {
  const [mines, setMines] = React.useState<Mine[]>([]);
  const [selectedMineId, setSelectedMineId] = React.useState<string>("");
  const [inputQuery, setInputQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [aiStatus, setAiStatus] = React.useState<"online" | "unavailable">("online");
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Welcome to CoalGuard AI. I am your operational governance assistant grounded in verified coal-mine safety, compliance, inspection, and incident records. Ask an operational question below or select one of the suggested inquiries.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      grounded: true,
      provider: "gemini",
      sources: [
        { type: "compliance", label: "Statutory Compliance Records" },
        { type: "inspections", label: "DGMS Safety Inspections" },
        { type: "incidents", label: "Incident & Hazard Register" },
      ],
    },
  ]);

  React.useEffect(() => {
    minesApi
      .list()
      .then((res) => {
        setMines(res.data);
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(queryToSend?: string) {
    const query = (queryToSend || inputQuery).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");
    setLoading(true);

    try {
      const response = await aiApi.askAssistant(query, selectedMineId || undefined);
      const data = response.data;
      const isUnavailable = data.provider === "unavailable";

      if (isUnavailable) {
        setAiStatus("unavailable");
      } else {
        setAiStatus("online");
      }

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        sender: "assistant",
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sources: data.sources,
        grounded: data.grounded,
        provider: data.provider,
        isUnavailable,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setAiStatus("unavailable");
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: "assistant",
        text: "AI service is temporarily unavailable. The database connection is working, but Gemini could not generate the requested analysis.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isUnavailable: true,
        provider: "unavailable",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleClearChat() {
    setMessages([
      {
        id: "welcome",
        sender: "assistant",
        text: "Chat cleared. Welcome to CoalGuard AI. How may I assist your statutory mining governance monitoring?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        grounded: true,
        provider: "gemini",
      },
    ]);
  }

  function handleRetry(lastUserMsg: string) {
    handleSend(lastUserMsg);
  }

  return (
    <div className="space-y-6">
      {/* Enterprise Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              CoalGuard AI
            </h1>
            {aiStatus === "online" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                AI Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                AI Temporarily Unavailable
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Governance intelligence for safer, compliant mining operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mine Scoping Selector */}
          <select
            value={selectedMineId}
            onChange={(e) => setSelectedMineId(e.target.value)}
            className="h-8 rounded-lg border border-border bg-card px-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
            aria-label="Filter scope by mine"
          >
            <option value="">All Authorized Mines</option>
            {mines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.code})
              </option>
            ))}
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
            title="Clear Chat History"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Suggested Inquiries
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="group flex flex-col justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-2 text-left transition-all hover:border-amber-500/60 hover:bg-slate-900 hover:shadow-xs disabled:opacity-50"
            >
              <span className="text-[11px] font-medium text-slate-300 group-hover:text-amber-400 leading-snug">
                {prompt}
              </span>
              <div className="mt-2 flex items-center justify-end text-[10px] text-slate-500 group-hover:text-amber-400">
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Conversation Container */}
      <Card className="border-border shadow-md bg-slate-950/40">
        <CardContent className="p-4 sm:p-5 space-y-4">
          {/* Messages Stream */}
          <div className="space-y-4 min-h-[420px] max-h-[580px] overflow-y-auto scrollbar-thin pr-1">
            {messages.map((m, idx) => {
              const isUser = m.sender === "user";
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-in fade-in-50 duration-150`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className="space-y-1.5 max-w-[85%] sm:max-w-[78%]">
                    <div
                      className={`rounded-xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-amber-500 text-slate-950 font-medium rounded-tr-none"
                          : m.isUnavailable
                          ? "bg-amber-950/20 border border-amber-500/30 text-amber-200 rounded-tl-none"
                          : "bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none"
                      }`}
                    >
                      {isUser ? (
                        <div className="whitespace-pre-line">{m.text}</div>
                      ) : m.isUnavailable ? (
                        <div className="flex items-start gap-2 text-amber-300">
                          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                          <div>{m.text}</div>
                        </div>
                      ) : (
                        <FormattedAssistantText text={m.text} />
                      )}

                      {/* Source attribution cards (Phase 10) */}
                      {!isUser && !m.isUnavailable && m.sources && m.sources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-800/80">
                          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                            <ShieldCheck className="h-3 w-3 text-emerald-400" />
                            <span>Verified from CoalGuard records</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {m.sources.map((s, sIdx) => {
                              const href = getSourceHref(s.type);
                              return (
                                <Link
                                  key={sIdx}
                                  href={href}
                                  className="inline-flex items-center gap-1 rounded bg-slate-800/90 hover:bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:text-white border border-slate-700/60 transition-colors"
                                >
                                  <span>&bull; {s.label}</span>
                                  <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions for Assistant */}
                    {!isUser && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
                        <span>{m.timestamp}</span>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(m.id, m.text)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Copy Response"
                          >
                            {copiedId === m.id ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                          {idx > 0 && messages[idx - 1]?.sender === "user" && (
                            <button
                              type="button"
                              onClick={() => handleRetry(messages[idx - 1]?.text ?? "")}
                              className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                              title="Regenerate Question"
                            >
                              <RefreshCw className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Clean Loading State */}
            {loading && (
              <div className="flex gap-3 justify-start animate-in fade-in-50">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Bot className="h-4 w-4 animate-pulse" />
                </div>
                <div className="rounded-xl rounded-tl-none border border-slate-800 bg-slate-900 p-3.5 space-y-2 max-w-[70%] shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    <span>Analyzing verified operational mine records...</span>
                  </div>
                  <div className="h-2 w-48 bg-slate-800 rounded animate-pulse" />
                  <div className="h-2 w-36 bg-slate-800/60 rounded animate-pulse" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Clean Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2 pt-2 border-t border-slate-800"
          >
            <input
              type="text"
              placeholder="Ask about high-risk mines, open incidents, overdue inspections, or compliance..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              className="flex-1 rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
            />
            <Button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="gap-1.5 px-4 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Send</span>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
