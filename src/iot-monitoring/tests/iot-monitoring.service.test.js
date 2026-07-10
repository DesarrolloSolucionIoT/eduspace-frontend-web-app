import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock http-common before importing the service (avoids axios/store/router)
vi.mock('../../shared/services/http-common.js', () => ({
    default: { get: vi.fn() },
}));

import http from '../../shared/services/http-common.js';
import { IotMonitoringService } from '../services/iot-monitoring.service.js';

function makeReading(overrides = {}) {
    return {
        id: 1,
        edgeReadingId: 1,
        deviceId: 'esp32-aula-101',
        zoneId: 'aula-101',
        temperature: 22.5,
        humidity: 55.0,
        occupancyPresent: false,
        alertLedState: 0,
        recordedAt: '2026-06-20T14:31:44Z',
        receivedAt: '2026-06-20T14:31:45Z',
        ...overrides,
    };
}

describe('IotMonitoringService', () => {
    let service;

    beforeEach(() => {
        service = new IotMonitoringService();
        vi.clearAllMocks();
    });

    // ── getSpaces — happy path ────────────────────────────────────────────────

    it('returns one space per unique zoneId', async () => {
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [makeReading()] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data).toHaveLength(1);
        expect(data[0].id).toBe('aula-101');
    });

    it('uses deviceId as group key when zoneId is null', async () => {
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings'))
                return Promise.resolve({ data: [makeReading({ zoneId: null })] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].id).toBe('esp32-aula-101');
    });

    it('sets space name from linked classroom when zoneId matches', async () => {
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [makeReading()] });
            if (url.includes('classrooms'))
                return Promise.resolve({ data: [{ id: 1, name: 'Aula 101', zoneId: 'aula-101' }] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].name).toBe('Aula 101');
    });

    it('falls back to zoneId as name when no classroom matches', async () => {
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [makeReading()] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].name).toBe('aula-101');
    });

    // ── status derivation ─────────────────────────────────────────────────────

    it('status is ok when alertLedState is 0 and reading is fresh', async () => {
        const recent = new Date(Date.now() - 30_000).toISOString(); // 30 s ago
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings'))
                return Promise.resolve({ data: [makeReading({ alertLedState: 0, recordedAt: recent })] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].status).toBe('ok');
    });

    it('status is warn when alertLedState is 1 and reading is fresh', async () => {
        const recent = new Date(Date.now() - 30_000).toISOString();
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings'))
                return Promise.resolve({ data: [makeReading({ alertLedState: 1, recordedAt: recent })] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].status).toBe('warn');
    });

    it('status is off when last reading is stale (> 10 min)', async () => {
        const stale = new Date(Date.now() - 11 * 60_000).toISOString(); // 11 min ago
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings'))
                return Promise.resolve({ data: [makeReading({ alertLedState: 0, recordedAt: stale })] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].status).toBe('off');
    });

    // ── history ───────────────────────────────────────────────────────────────

    it('history contains all readings for a zone in ascending order', async () => {
        const r1 = makeReading({ edgeReadingId: 1, recordedAt: '2026-06-20T14:00:00Z', temperature: 21.0 });
        const r2 = makeReading({ edgeReadingId: 2, recordedAt: '2026-06-20T14:15:00Z', temperature: 22.0 });
        const r3 = makeReading({ edgeReadingId: 3, recordedAt: '2026-06-20T14:30:00Z', temperature: 23.0 });
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [r3, r1, r2] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].history).toHaveLength(3);
        expect(data[0].history[0].temperature).toBe(21.0);
        expect(data[0].history[2].temperature).toBe(23.0);
    });

    // ── latest reading propagation ────────────────────────────────────────────

    it('temperature and humidity come from the most recent reading', async () => {
        const old = makeReading({ edgeReadingId: 1, recordedAt: '2026-06-20T14:00:00Z', temperature: 20.0, humidity: 50.0 });
        const latest = makeReading({ edgeReadingId: 2, recordedAt: '2026-06-20T14:30:00Z', temperature: 26.5, humidity: 72.0 });
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [old, latest] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data[0].temperature).toBe(26.5);
        expect(data[0].humidity).toBe(72.0);
    });

    // ── multiple zones ────────────────────────────────────────────────────────

    it('groups readings into separate spaces per zone', async () => {
        const r1 = makeReading({ edgeReadingId: 1, zoneId: 'aula-101', deviceId: 'esp32-a' });
        const r2 = makeReading({ edgeReadingId: 2, zoneId: 'lab-22', deviceId: 'esp32-b' });
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [r1, r2] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data).toHaveLength(2);
        expect(data.map(s => s.id).sort()).toEqual(['aula-101', 'lab-22'].sort());
    });

    // ── classrooms endpoint failure ───────────────────────────────────────────

    it('still returns spaces when classrooms endpoint fails', async () => {
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [makeReading()] });
            if (url.includes('classrooms')) return Promise.reject(new Error('network'));
        });

        const { data } = await service.getSpaces();
        expect(data).toHaveLength(1);
        expect(data[0].name).toBe('aula-101'); // falls back to zoneId
    });

    // ── empty readings ────────────────────────────────────────────────────────

    it('returns empty array when there are no readings', async () => {
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        expect(data).toEqual([]);
    });

    // ── getAlerts ─────────────────────────────────────────────────────────────

    it('getAlerts returns only warn spaces', async () => {
        const recent = new Date(Date.now() - 30_000).toISOString();
        const alert = makeReading({ edgeReadingId: 1, zoneId: 'aula-101', alertLedState: 1, recordedAt: recent });
        const ok = makeReading({ edgeReadingId: 2, zoneId: 'lab-22', deviceId: 'esp32-b', alertLedState: 0, recordedAt: recent });
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [alert, ok] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getAlerts();
        expect(data).toHaveLength(1);
        expect(data[0].spaceId).toBe('aula-101');
        expect(data[0].status).toBe('warn');
    });

    // ── UTC timestamp handling ────────────────────────────────────────────────

    it('handles timestamps without Z suffix (ASP.NET format)', async () => {
        // ASP.NET serializes DateTime without timezone → treated as UTC
        const noZ = makeReading({ recordedAt: '2026-06-20T14:31:44' });
        const recent = new Date(Date.now() - 30_000);
        noZ.recordedAt = recent.toISOString().replace('Z', '');
        http.get.mockImplementation((url) => {
            if (url.includes('sensor-readings')) return Promise.resolve({ data: [noZ] });
            if (url.includes('classrooms')) return Promise.resolve({ data: [] });
        });

        const { data } = await service.getSpaces();
        // Should parse as UTC and be recent enough to not be "off"
        expect(data[0].status).not.toBe('off');
    });
});
