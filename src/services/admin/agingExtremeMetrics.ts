import { Timestamp, type QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { getFirestore } from '@/lib/server/firebaseAdmin';
import type {
	AgingExtremeMetrics,
	AgingExtremeRolling14dVariation,
	AgingExtremeSeriesPoint,
	AgingExtremeVariation,
	TimeWindow,
} from './dashboardV3Types';

const AGING_EXTREME_COLLECTION = 'admin_metrics_aging_extreme_daily';
const AGING_EXTREME_THRESHOLD_HOURS = 72;
const AGING_EXTREME_METHOD_VERSION: AgingExtremeMetrics['methodologyVersion'] = 'v1';

interface AgingExtremeSnapshotDocument {
	day: string;
	referenceWindowDays: TimeWindow;
	extremeItems: number;
	collectedAt: string;
	methodologyVersion: AgingExtremeMetrics['methodologyVersion'];
	thresholdHours: number;
}

function toDate(value: unknown): Date | null {
	if (!value) return null;
	if (value instanceof Timestamp) return value.toDate();
	if (value instanceof Date) return value;
	if (typeof value === 'string' || typeof value === 'number') {
		const parsed = new Date(value);
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	const withToDate = value as { toDate?: () => Date };
	if (typeof withToDate.toDate === 'function') {
		const parsed = withToDate.toDate();
		return Number.isNaN(parsed.getTime()) ? null : parsed;
	}

	return null;
}

function toDayKey(date: Date): string {
	return date.toISOString().slice(0, 10);
}

function parseDayKey(day: string): Date {
	return new Date(`${day}T00:00:00.000Z`);
}

function getHoursSince(value: unknown): number | null {
	const date = toDate(value);
	if (!date) return null;
	return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

function calculatePercentChange(current: number, previous: number): number {
	if (previous === 0) return current > 0 ? 100 : 0;
	return Number((((current - previous) / previous) * 100).toFixed(2));
}

function computeExtremeItems(jobs: Array<Record<string, any>>): number {
	return jobs.reduce((count, job) => {
		const agingHours = getHoursSince(job.createdAt);
		if (agingHours === null) return count;
		return agingHours > AGING_EXTREME_THRESHOLD_HOURS ? count + 1 : count;
	}, 0);
}

async function loadJobsForWindow(windowDays: TimeWindow): Promise<Array<Record<string, any>>> {
	const db = getFirestore();
	const periodStart = new Date(Date.now() - windowDays * 24 * 60 * 60 * 1000);

	const snapshot = await db.collection('jobs')
		.where('createdAt', '>=', Timestamp.fromDate(periodStart))
		.get();

	return snapshot.docs.map((doc: QueryDocumentSnapshot) => ({
		id: doc.id,
		...doc.data(),
	}));
}

async function loadSeries(windowDays: TimeWindow, lookbackDays: number): Promise<AgingExtremeSeriesPoint[]> {
	const db = getFirestore();
	const fromDay = toDayKey(new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000));

	const snapshot = await db.collection(AGING_EXTREME_COLLECTION)
		.where('day', '>=', fromDay)
		.orderBy('day', 'asc')
		.get();

	return snapshot.docs
		.map((doc: QueryDocumentSnapshot) => doc.data() as AgingExtremeSnapshotDocument)
		.filter((item: AgingExtremeSnapshotDocument) => item.referenceWindowDays === windowDays)
		.map((item: AgingExtremeSnapshotDocument) => ({
			day: item.day,
			referenceWindowDays: item.referenceWindowDays,
			extremeItems: item.extremeItems,
			collectedAt: item.collectedAt,
		}));
}

function findLatestOnOrBefore(series: AgingExtremeSeriesPoint[], targetDay: string): AgingExtremeSeriesPoint | null {
	const filtered = series.filter((point) => point.day <= targetDay);
	return filtered.length > 0 ? filtered[filtered.length - 1] : null;
}

function buildWeeklyVariation(series: AgingExtremeSeriesPoint[], currentDay: string, currentCount: number): AgingExtremeVariation {
	const baselineDay = toDayKey(new Date(parseDayKey(currentDay).getTime() - 7 * 24 * 60 * 60 * 1000));
	const previousPoint = findLatestOnOrBefore(series, baselineDay);

	if (!previousPoint) {
		return {
			current: currentCount,
			previous: null,
			absolute: null,
			percent: null,
			hasBaseline: false,
			baselineDay: null,
		};
	}

	const absolute = currentCount - previousPoint.extremeItems;

	return {
		current: currentCount,
		previous: previousPoint.extremeItems,
		absolute,
		percent: calculatePercentChange(currentCount, previousPoint.extremeItems),
		hasBaseline: true,
		baselineDay: previousPoint.day,
	};
}

function average(values: number[]): number {
	if (values.length === 0) return 0;
	return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

function buildRolling14dVariation(series: AgingExtremeSeriesPoint[], currentDay: string): AgingExtremeRolling14dVariation {
	const currentDate = parseDayKey(currentDay);
	const last14Days = series.filter((point) => {
		const pointDate = parseDayKey(point.day);
		const diffDays = Math.floor((currentDate.getTime() - pointDate.getTime()) / (24 * 60 * 60 * 1000));
		return diffDays >= 0 && diffDays <= 13;
	});

	if (last14Days.length < 14) {
		return {
			currentAverage: average(last14Days.slice(-7).map((point) => point.extremeItems)),
			previousAverage: null,
			absolute: null,
			percent: null,
			hasBaseline: false,
			sampleDays: last14Days.length,
		};
	}

	const ordered = [...last14Days].sort((a, b) => a.day.localeCompare(b.day));
	const previous7 = ordered.slice(0, 7).map((point) => point.extremeItems);
	const current7 = ordered.slice(7, 14).map((point) => point.extremeItems);

	const previousAverage = average(previous7);
	const currentAverage = average(current7);

	return {
		currentAverage,
		previousAverage,
		absolute: Number((currentAverage - previousAverage).toFixed(2)),
		percent: calculatePercentChange(currentAverage, previousAverage),
		hasBaseline: true,
		sampleDays: ordered.length,
	};
}

export async function collectAgingExtremeSnapshot(windowDays: TimeWindow): Promise<AgingExtremeSeriesPoint> {
	const jobs = await loadJobsForWindow(windowDays);
	const extremeItems = computeExtremeItems(jobs);
	const now = new Date();

	const point: AgingExtremeSeriesPoint = {
		day: toDayKey(now),
		referenceWindowDays: windowDays,
		extremeItems,
		collectedAt: now.toISOString(),
	};

	const db = getFirestore();
	const docId = `${point.day}_${windowDays}`;

	const snapshotDoc: AgingExtremeSnapshotDocument = {
		day: point.day,
		referenceWindowDays: point.referenceWindowDays,
		extremeItems: point.extremeItems,
		collectedAt: point.collectedAt,
		methodologyVersion: AGING_EXTREME_METHOD_VERSION,
		thresholdHours: AGING_EXTREME_THRESHOLD_HOURS,
	};

	await db.collection(AGING_EXTREME_COLLECTION).doc(docId).set(snapshotDoc, { merge: true });

	return point;
}

export async function buildAgingExtremeMetrics(
	windowDays: TimeWindow,
	jobs: Array<Record<string, any>>,
): Promise<AgingExtremeMetrics> {
	const now = new Date();
	const currentDay = toDayKey(now);
	const currentCount = computeExtremeItems(jobs);
	const currentCollectedAt = now.toISOString();

	let seriesDaily: AgingExtremeSeriesPoint[] = [];
	try {
		seriesDaily = await loadSeries(windowDays, 35);
	} catch {
		// Falha de leitura historica nao deve quebrar o agregador principal.
		seriesDaily = [];
	}

	const hasTodayPoint = seriesDaily.some((point) => point.day === currentDay);
	const effectiveSeries = hasTodayPoint
		? seriesDaily
		: [...seriesDaily, {
			day: currentDay,
			referenceWindowDays: windowDays,
			extremeItems: currentCount,
			collectedAt: currentCollectedAt,
		}];

	const sortedSeries = effectiveSeries
		.sort((a, b) => a.day.localeCompare(b.day))
		.slice(-35);

	return {
		thresholdHours: AGING_EXTREME_THRESHOLD_HOURS,
		methodologyVersion: AGING_EXTREME_METHOD_VERSION,
		windowDays,
		current: {
			extremeItems: currentCount,
			collectedAt: currentCollectedAt,
			status: 'available',
			reason: null,
		},
		seriesDaily: sortedSeries,
		variation: {
			weekly: buildWeeklyVariation(sortedSeries, currentDay, currentCount),
			rolling14d: buildRolling14dVariation(sortedSeries, currentDay),
		},
	};
}
