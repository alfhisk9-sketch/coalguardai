import type { ComplianceRequirement } from "@sih/types";

/**
 * MOCK ADAPTERS — clearly isolated, typed demo data for the four C1 modules that ship
 * POST-only route handlers with no GET/list endpoint (attendance, environmental
 * readings, production reports, grievances) plus compliance requirements.
 *
 * These cannot be replaced with a minimal Account 2 GET route the way observations,
 * contractors and corrective actions were: those three had existing Db/service
 * abstractions to wrap, whereas these four bypass the Db layer entirely and write
 * direct Supabase calls (docs/HANDOFF.md flags them as the "lighter tier"). Adding
 * reads would mean extending the Db interface for tables it has never modelled, which
 * is Account 1's call, not a minimal integration change.
 *
 * Every page consuming these MUST render a visible "Demo data" badge.
 */
function delay<T>(value: T, ms = 220): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const mockComplianceRequirements: ComplianceRequirement[] = [
  { id: "cr-1", mineId: "mine-1", categoryId: null, title: "Annual mine safety audit", description: "Statutory annual safety audit.", regulatoryAuthority: "DGMS", frequency: "ANNUAL", priority: "CRITICAL", isDemoContent: true },
  { id: "cr-2", mineId: "mine-1", categoryId: null, title: "Effluent discharge quality report", description: "Quarterly water quality submission.", regulatoryAuthority: "State Pollution Control Board", frequency: "QUARTERLY", priority: "HIGH", isDemoContent: true },
  { id: "cr-3", mineId: "mine-1", categoryId: null, title: "Fire safety equipment inspection", description: "Monthly firefighting equipment check.", regulatoryAuthority: "DGMS", frequency: "MONTHLY", priority: "HIGH", isDemoContent: true },
];

export interface MockWorker {
  id: string;
  fullName: string;
  contractorName: string;
  mineName: string;
  category: string;
  status: "ACTIVE" | "INACTIVE";
}

export const mockWorkers: MockWorker[] = [
  { id: "w-1", fullName: "Ramesh Patil", contractorName: "Bharat Earthmovers Pvt Ltd", mineName: "Demo Mine North", category: "Heavy equipment operator", status: "ACTIVE" },
  { id: "w-2", fullName: "Sunita Deshmukh", contractorName: "Bharat Earthmovers Pvt Ltd", mineName: "Demo Mine North", category: "Safety marshal", status: "ACTIVE" },
  { id: "w-3", fullName: "Arun Kumar", contractorName: "Coalfield Logistics Co.", mineName: "Demo Mine North", category: "Haul truck driver", status: "ACTIVE" },
  { id: "w-4", fullName: "Priya Nair", contractorName: "Coalfield Logistics Co.", mineName: "Demo Mine South", category: "Loader operator", status: "INACTIVE" },
  { id: "w-5", fullName: "Imran Sheikh", contractorName: "Vindhya Drilling Services", mineName: "Demo Mine South", category: "Drill operator", status: "ACTIVE" },
];

export interface MockAttendance {
  id: string;
  workerName: string;
  contractorName: string;
  mineName: string;
  attendanceDate: string;
  checkIn: string | null;
  checkOut: string | null;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "ON_LEAVE";
  latitude: number | null;
  longitude: number | null;
  source: "MOBILE_APP" | "WEB";
  syncStatus: "SYNCED" | "PENDING";
}

const today = new Date().toISOString().slice(0, 10);

export const mockAttendance: MockAttendance[] = [
  { id: "a-1", workerName: "Ramesh Patil", contractorName: "Bharat Earthmovers Pvt Ltd", mineName: "Demo Mine North", attendanceDate: today, checkIn: `${today}T06:58:00Z`, checkOut: `${today}T15:04:00Z`, status: "PRESENT", latitude: 21.2514, longitude: 81.6296, source: "MOBILE_APP", syncStatus: "SYNCED" },
  { id: "a-2", workerName: "Sunita Deshmukh", contractorName: "Bharat Earthmovers Pvt Ltd", mineName: "Demo Mine North", attendanceDate: today, checkIn: `${today}T07:02:00Z`, checkOut: null, status: "PRESENT", latitude: 21.2517, longitude: 81.6301, source: "MOBILE_APP", syncStatus: "PENDING" },
  { id: "a-3", workerName: "Arun Kumar", contractorName: "Coalfield Logistics Co.", mineName: "Demo Mine North", attendanceDate: today, checkIn: null, checkOut: null, status: "ON_LEAVE", latitude: null, longitude: null, source: "WEB", syncStatus: "SYNCED" },
  { id: "a-4", workerName: "Imran Sheikh", contractorName: "Vindhya Drilling Services", mineName: "Demo Mine South", attendanceDate: today, checkIn: `${today}T06:45:00Z`, checkOut: `${today}T11:30:00Z`, status: "HALF_DAY", latitude: 20.9412, longitude: 82.1104, source: "MOBILE_APP", syncStatus: "SYNCED" },
];

export interface MockReading {
  id: string;
  parameterType: "AIR_QUALITY" | "DUST" | "WATER" | "NOISE" | "LAND";
  value: number;
  unit: string;
  thresholdValue: number;
  status: "NORMAL" | "WARNING" | "EXCEEDED";
  locationName: string;
  recordedAt: string;
}

export const mockReadings: MockReading[] = [
  { id: "er-1", parameterType: "DUST", value: 118, unit: "µg/m³", thresholdValue: 150, status: "NORMAL", locationName: "Haul road checkpoint 1", recordedAt: `${today}T04:00:00Z` },
  { id: "er-2", parameterType: "DUST", value: 164, unit: "µg/m³", thresholdValue: 150, status: "EXCEEDED", locationName: "Crusher area", recordedAt: `${today}T04:00:00Z` },
  { id: "er-3", parameterType: "NOISE", value: 82, unit: "dB(A)", thresholdValue: 85, status: "WARNING", locationName: "Workshop perimeter", recordedAt: `${today}T05:30:00Z` },
  { id: "er-4", parameterType: "WATER", value: 6.9, unit: "pH", thresholdValue: 8.5, status: "NORMAL", locationName: "Settling pond outlet", recordedAt: `${today}T05:45:00Z` },
  { id: "er-5", parameterType: "AIR_QUALITY", value: 91, unit: "AQI", thresholdValue: 100, status: "WARNING", locationName: "Administrative block", recordedAt: `${today}T06:00:00Z` },
];

export interface MockProductionReport {
  id: string;
  mineName: string;
  periodStart: string;
  periodEnd: string;
  targetQuantity: number;
  actualQuantity: number;
  unit: string;
  status: "DRAFT" | "SUBMITTED" | "APPROVED";
}

export const mockProduction: MockProductionReport[] = [
  { id: "pr-1", mineName: "Demo Mine North", periodStart: "2026-04-01", periodEnd: "2026-04-30", targetQuantity: 42000, actualQuantity: 39850, unit: "tonnes", status: "APPROVED" },
  { id: "pr-2", mineName: "Demo Mine North", periodStart: "2026-05-01", periodEnd: "2026-05-31", targetQuantity: 42000, actualQuantity: 43120, unit: "tonnes", status: "APPROVED" },
  { id: "pr-3", mineName: "Demo Mine North", periodStart: "2026-06-01", periodEnd: "2026-06-30", targetQuantity: 44000, actualQuantity: 41005, unit: "tonnes", status: "APPROVED" },
  { id: "pr-4", mineName: "Demo Mine North", periodStart: "2026-07-01", periodEnd: "2026-07-31", targetQuantity: 44000, actualQuantity: 45230, unit: "tonnes", status: "SUBMITTED" },
  { id: "pr-5", mineName: "Demo Mine North", periodStart: "2026-08-01", periodEnd: "2026-08-31", targetQuantity: 45000, actualQuantity: 42980, unit: "tonnes", status: "DRAFT" },
];

export interface MockGrievance {
  id: string;
  title: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "ASSIGNED" | "RESOLVED" | "CLOSED";
  submittedAt: string;
  assignedTo: string | null;
  isConfidential: boolean;
}

export const mockGrievances: MockGrievance[] = [
  { id: "g-1", title: "Inadequate rest shelter at haul road checkpoint", category: "Welfare", priority: "MEDIUM", status: "ASSIGNED", submittedAt: "2026-09-08T09:15:00Z", assignedTo: "Mine welfare officer", isConfidential: true },
  { id: "g-2", title: "Delayed PPE replacement for night shift", category: "Safety", priority: "HIGH", status: "OPEN", submittedAt: "2026-09-11T17:40:00Z", assignedTo: null, isConfidential: true },
  { id: "g-3", title: "Canteen hygiene concerns", category: "Welfare", priority: "LOW", status: "RESOLVED", submittedAt: "2026-08-29T12:05:00Z", assignedTo: "Site administrator", isConfidential: true },
];

export const mockApi = {
  isMock: true as const,
  listComplianceRequirements: (mineId: string) => delay(mockComplianceRequirements.filter((r) => r.mineId === mineId)),
  listWorkers: () => delay(mockWorkers),
  listAttendance: () => delay(mockAttendance),
  listEnvironmentalReadings: () => delay(mockReadings),
  listProductionReports: () => delay(mockProduction),
  listGrievances: () => delay(mockGrievances),
};
