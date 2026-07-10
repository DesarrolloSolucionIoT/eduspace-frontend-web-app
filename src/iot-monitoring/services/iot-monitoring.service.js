import http from '../../shared/services/http-common.js';

// A reading is considered "stale" (device offline) when its most recent
// reading is older than this window.
const STALE_MS = 10 * 60 * 1000; // 10 min

/**
 * Parse a backend timestamp as UTC. ASP.NET may serialize DateTime without a
 * timezone designator (e.g. "2026-06-20T14:31:44"); JS would otherwise read it
 * as local time. We append 'Z' when no offset/zone is present.
 */
function parseUtc(value) {
    if (!value) return null;
    const hasZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value);
    const date = new Date(hasZone ? value : `${value}Z`);
    return Number.isNaN(date.getTime()) ? null : date;
}

function deriveStatus(latest) {
    if (!latest || !latest._recordedAt) return 'off';
    if (Date.now() - latest._recordedAt.getTime() > STALE_MS) return 'off';
    return latest.alertLedState >= 1 ? 'warn' : 'ok';
}

/**
 * IoT monitoring data, sourced from the EduSpace platform backend
 * (IoTMonitoring bounded context) and the Classrooms module for zone names.
 *
 * Backend only exposes: temperature, humidity, occupancyPresent (bool) and
 * alertLedState (0/1) per reading. Anything beyond that is intentionally absent.
 */
export class IotMonitoringService {
    readingsEndpoint = '/iot-monitoring/sensor-readings';
    classroomsEndpoint = '/classrooms';

    getAllReadings() {
        return http.get(this.readingsEndpoint);
    }

    getClassrooms() {
        return http.get(this.classroomsEndpoint);
    }

    getReadingsByZone(zoneId) {
        return http.get(`${this.readingsEndpoint}/zone/${zoneId}`);
    }

    getLatestByZone(zoneId) {
        return http.get(`${this.readingsEndpoint}/zone/${zoneId}/latest`);
    }

    /**
     * Assemble the list of monitored spaces from all sensor readings, grouped by
     * zone, enriched with the classroom name when a classroom is linked to that
     * zone. Returns { data: [...] } to keep the previous service contract.
     */
    async getSpaces() {
        const [readingsRes, classroomsRes] = await Promise.all([
            this.getAllReadings(),
            this.getClassrooms().catch(() => ({ data: [] })),
        ]);

        const readings = readingsRes.data || [];
        const classrooms = classroomsRes.data || [];

        const nameByZone = {};
        classrooms.forEach(c => {
            if (c.zoneId) nameByZone[c.zoneId] = c.name;
        });

        // Group readings by zoneId (falling back to deviceId when no zone).
        const groups = new Map();
        for (const r of readings) {
            const key = r.zoneId || r.deviceId;
            if (!key) continue;
            const reading = { ...r, _recordedAt: parseUtc(r.recordedAt) };
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(reading);
        }

        const spaces = [];
        for (const [key, group] of groups) {
            // Sort ascending by recorded time so the last item is the latest.
            group.sort((a, b) => (a._recordedAt?.getTime() || 0) - (b._recordedAt?.getTime() || 0));
            const latest = group[group.length - 1];

            spaces.push({
                id: key,
                zoneId: latest.zoneId || null,
                deviceId: latest.deviceId,
                name: nameByZone[key] || latest.zoneId || latest.deviceId,
                status: deriveStatus(latest),
                temperature: latest.temperature ?? null,
                humidity: latest.humidity ?? null,
                occupancyPresent: latest.occupancyPresent ?? null,
                alertLedState: latest.alertLedState ?? 0,
                recordedAt: latest._recordedAt ? latest._recordedAt.toISOString() : null,
                history: group.map(r => ({
                    recordedAt: r._recordedAt ? r._recordedAt.toISOString() : null,
                    temperature: r.temperature,
                    humidity: r.humidity,
                    occupancyPresent: r.occupancyPresent,
                    alertLedState: r.alertLedState,
                })),
            });
        }

        // Active alerts first, then by name for a stable order.
        spaces.sort((a, b) => {
            const rank = s => (s.status === 'warn' ? 0 : s.status === 'off' ? 2 : 1);
            return rank(a) - rank(b) || a.name.localeCompare(b.name);
        });

        return { data: spaces };
    }

    async getAlerts() {
        const { data } = await this.getSpaces();
        return {
            data: data
                .filter(s => s.status === 'warn')
                .map(s => ({ spaceId: s.id, spaceName: s.name, status: s.status })),
        };
    }
}
