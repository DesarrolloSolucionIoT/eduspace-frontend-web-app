import http from '../../shared/services/http-common.js';
import mockDb from './db.json';

/**
 * Combines Platform classrooms + latest sensor readings into the IotSpace shape.
 *
 * Strategy:
 *   1. GET /classrooms  — all classrooms (each may have a zoneId).
 *   2. GET /sensor-readings  — all readings; group by zoneId; pick latest per zone.
 *   3. For each classroom: if it has a zoneId and a matching latest reading, use
 *      real sensor data.  Otherwise fall through to mock data from db.json.
 *
 * This lets the page work immediately even before devices are online.
 */
export class IotMonitoringService {
    async getSpaces() {
        try {
            const [classroomsResp, readingsResp] = await Promise.all([
                http.get('/classrooms'),
                http.get('/sensor-readings'),
            ]);

            const classrooms = classroomsResp.data || [];
            const readings   = readingsResp.data  || [];

            // Build a map zone_id → latest reading
            const latestByZone = _buildLatestByZone(readings);

            const spaces = classrooms.map(c => _toIotSpace(c, latestByZone));
            return { data: spaces };
        } catch (err) {
            console.warn('[IotMonitoringService] API unavailable, using mock data.', err.message);
            return { data: mockDb.spaces };
        }
    }

    async getSpaceById(spaceId) {
        try {
            const [classroomResp, readingsResp] = await Promise.all([
                http.get(`/classrooms/${spaceId}`),
                http.get('/sensor-readings'),
            ]);
            const classroom = classroomResp.data;
            const readings  = readingsResp.data || [];
            const latestByZone = _buildLatestByZone(readings);
            return { data: _toIotSpace(classroom, latestByZone) };
        } catch (err) {
            console.warn('[IotMonitoringService] API unavailable, using mock data.', err.message);
            const space = mockDb.spaces.find(s => String(s.id) === String(spaceId));
            return { data: space || null };
        }
    }

    async getAlerts() {
        try {
            const { data: spaces } = await this.getSpaces();
            const alerts = (spaces || [])
                .filter(s => s.status === 'warn' || s.status === 'danger')
                .map(s => ({
                    spaceId: s.id,
                    spaceName: s.name,
                    status: s.status,
                    meta: s.meta,
                    lastEvent: s.events?.[0] || null,
                }));
            return { data: alerts };
        } catch (err) {
            console.error('[IotMonitoringService] getAlerts error', err);
            return { data: [] };
        }
    }
}

// ── helpers ──────────────────────────────────────────────────────────────────

function _buildLatestByZone(readings) {
    const map = new Map();
    for (const r of readings) {
        const key = r.zoneId;
        if (!key) continue;
        const existing = map.get(key);
        if (!existing || new Date(r.recordedAt) > new Date(existing.recordedAt)) {
            map.set(key, r);
        }
    }
    return map;
}

/**
 * Map a Platform Classroom + optional latest SensorReading to the IotSpace shape
 * that the rest of the component expects.
 */
function _toIotSpace(classroom, latestByZone) {
    const zoneId  = classroom.zoneId || null;
    const reading = zoneId ? latestByZone.get(zoneId) : null;

    if (!reading) {
        // No live data — return offline representation
        return {
            id: String(classroom.id),
            name: classroom.name,
            status: 'off',
            temperature: null,
            meta: zoneId ? 'sin lecturas IoT' : 'sin dispositivo',
            location: classroom.description || '',
            session: null,
            deviceCode: zoneId || '',
            firmware: '',
            rssi: null,
            lastReadingTime: '',
            lastReadingAgo: '',
            sensors: {
                occupancy:   { value: null, occupancyPresent: null, capacity: null, delta: 'sin datos', deltaStatus: 'warn' },
                temperature: { value: null, delta: 'sin datos', deltaStatus: 'warn' },
                humidity:    { value: null, delta: 'sin datos', deltaStatus: 'warn' },
            },
            events: [],
            isLive: false,
        };
    }

    // Derive status from alert_led_state: 0=ok, 1=warn, 2+=danger
    const status = _ledStateToStatus(reading.alertLedState);

    // Occupancy: PIR bool — Ocupado / Libre
    const occPresent = reading.occupancyPresent;
    const occMeta = occPresent ? 'Ocupado' : 'Libre';

    const recordedAt = new Date(reading.recordedAt);
    const lastReadingTime = recordedAt.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const secsAgo = Math.round((Date.now() - recordedAt.getTime()) / 1000);
    const lastReadingAgo = secsAgo < 60 ? `${secsAgo}s` : `${Math.round(secsAgo / 60)}m`;

    return {
        id: String(classroom.id),
        name: classroom.name,
        status,
        temperature: reading.temperature,
        meta: `${occMeta} · T:${reading.temperature.toFixed(1)}°C · H:${reading.humidity.toFixed(0)}%`,
        location: classroom.description || '',
        session: null,
        deviceCode: reading.deviceId,
        firmware: '',
        rssi: null,
        lastReadingTime,
        lastReadingAgo,
        sensors: {
            occupancy: {
                value: occPresent ? 1 : 0,
                occupancyPresent: occPresent,
                capacity: null,
                delta: occPresent ? 'Presencia detectada' : 'Sin presencia',
                deltaStatus: 'neutral',
            },
            temperature: {
                value: reading.temperature,
                delta: _tempDelta(reading.temperature),
                deltaStatus: _tempDeltaStatus(reading.temperature),
            },
            humidity: {
                value: reading.humidity,
                delta: _humidDelta(reading.humidity),
                deltaStatus: _humidDeltaStatus(reading.humidity),
            },
        },
        events: [],
        isLive: true,
    };
}

function _ledStateToStatus(ledState) {
    if (ledState === 0) return 'ok';
    if (ledState === 1) return 'warn';
    return 'danger';
}

function _tempDelta(t) {
    if (t < 18) return '▼ por debajo de rango';
    if (t > 28) return `▲ ${(t - 28).toFixed(1)}°C sobre rango`;
    return 'en rango';
}

function _tempDeltaStatus(t) {
    if (t < 18 || t > 28) return 'warn';
    if (t > 25) return 'warn';
    return 'ok';
}

function _humidDelta(h) {
    if (h < 30) return '▼ humedad baja';
    if (h > 75) return `▲ humedad elevada`;
    return 'en rango';
}

function _humidDeltaStatus(h) {
    if (h < 30 || h > 75) return 'warn';
    return 'ok';
}
