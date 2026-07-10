import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { IotSpace } from '../model/iot-space.entity.js';

const NOW = new Date('2026-06-20T14:32:00Z');

describe('IotSpace entity', () => {
    beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW); });
    afterEach(() => { vi.useRealTimers(); });

    // ── Construction defaults ─────────────────────────────────────────────────

    it('defaults status to off when not provided', () => {
        const space = new IotSpace({});
        expect(space.status).toBe('off');
    });

    it('defaults temperature and humidity to null', () => {
        const space = new IotSpace({});
        expect(space.temperature).toBeNull();
        expect(space.humidity).toBeNull();
    });

    it('defaults history to empty array', () => {
        const space = new IotSpace({});
        expect(space.history).toEqual([]);
    });

    // ── isOnline ──────────────────────────────────────────────────────────────

    it('isOnline returns true when status is ok', () => {
        expect(new IotSpace({ status: 'ok' }).isOnline).toBe(true);
    });

    it('isOnline returns true when status is warn', () => {
        expect(new IotSpace({ status: 'warn' }).isOnline).toBe(true);
    });

    it('isOnline returns false when status is off', () => {
        expect(new IotSpace({ status: 'off' }).isOnline).toBe(false);
    });

    // ── hasAlert ──────────────────────────────────────────────────────────────

    it('hasAlert returns true when status is warn', () => {
        expect(new IotSpace({ status: 'warn' }).hasAlert).toBe(true);
    });

    it('hasAlert returns false when status is ok', () => {
        expect(new IotSpace({ status: 'ok' }).hasAlert).toBe(false);
    });

    it('hasAlert returns false when status is off', () => {
        expect(new IotSpace({ status: 'off' }).hasAlert).toBe(false);
    });

    // ── recordedDate ──────────────────────────────────────────────────────────

    it('recordedDate returns null when recordedAt is null', () => {
        const space = new IotSpace({ recordedAt: null });
        expect(space.recordedDate).toBeNull();
    });

    it('recordedDate parses ISO string to Date', () => {
        const space = new IotSpace({ recordedAt: '2026-06-20T14:31:44.000Z' });
        expect(space.recordedDate).toBeInstanceOf(Date);
        expect(space.recordedDate.toISOString()).toBe('2026-06-20T14:31:44.000Z');
    });

    // ── lastReadingTime ───────────────────────────────────────────────────────

    it('lastReadingTime returns "—" when recordedAt is null', () => {
        const space = new IotSpace({ recordedAt: null });
        expect(space.lastReadingTime).toBe('—');
    });

    it('lastReadingTime returns formatted time when recordedAt is set', () => {
        const space = new IotSpace({ recordedAt: '2026-06-20T14:31:44.000Z' });
        // Accepts any HH:MM:SS format (locale-dependent)
        expect(space.lastReadingTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    // ── lastReadingAgo ────────────────────────────────────────────────────────

    it('lastReadingAgo returns "—" when recordedAt is null', () => {
        const space = new IotSpace({ recordedAt: null });
        expect(space.lastReadingAgo).toBe('—');
    });

    it('lastReadingAgo returns seconds format when elapsed < 60s', () => {
        const recordedAt = new Date(NOW.getTime() - 18_000).toISOString(); // 18 s ago
        const space = new IotSpace({ recordedAt });
        expect(space.lastReadingAgo).toBe('18s');
    });

    it('lastReadingAgo returns minutes format when elapsed 1–59 min', () => {
        const recordedAt = new Date(NOW.getTime() - 12 * 60_000).toISOString(); // 12 min ago
        const space = new IotSpace({ recordedAt });
        expect(space.lastReadingAgo).toBe('12 min');
    });

    it('lastReadingAgo returns hours format when elapsed >= 60 min', () => {
        const recordedAt = new Date(NOW.getTime() - (6 * 3600 + 32 * 60) * 1000).toISOString();
        const space = new IotSpace({ recordedAt });
        expect(space.lastReadingAgo).toBe('6 h 32 m');
    });

    it('lastReadingAgo returns 0s when recording is exactly now', () => {
        const space = new IotSpace({ recordedAt: NOW.toISOString() });
        expect(space.lastReadingAgo).toBe('0s');
    });

    // ── occupancyPresent ──────────────────────────────────────────────────────

    it('stores occupancyPresent true', () => {
        const space = new IotSpace({ occupancyPresent: true });
        expect(space.occupancyPresent).toBe(true);
    });

    it('stores occupancyPresent false', () => {
        const space = new IotSpace({ occupancyPresent: false });
        expect(space.occupancyPresent).toBe(false);
    });

    it('defaults occupancyPresent to null', () => {
        const space = new IotSpace({});
        expect(space.occupancyPresent).toBeNull();
    });

    // ── alertLedState ─────────────────────────────────────────────────────────

    it('alertLedState defaults to 0', () => {
        const space = new IotSpace({});
        expect(space.alertLedState).toBe(0);
    });

    it('stores alertLedState 1', () => {
        const space = new IotSpace({ alertLedState: 1 });
        expect(space.alertLedState).toBe(1);
    });
});
