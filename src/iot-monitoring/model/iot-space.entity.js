/**
 * A monitored space (one Edge zone / device) as exposed by the platform backend.
 *
 * Only fields with real backend support are modeled: temperature, humidity,
 * occupancy presence (boolean) and the alert LED state (0/1). Derived display
 * values (status label timing) are computed from `recordedAt`.
 */
export class IotSpace {
    constructor({
        id = '',
        name = '',
        zoneId = null,
        deviceId = '',
        status = 'off',
        temperature = null,
        humidity = null,
        occupancyPresent = null,
        alertLedState = 0,
        recordedAt = null,
        history = [],
    }) {
        this.id = id;
        this.name = name;
        this.zoneId = zoneId;
        this.deviceId = deviceId;
        this.status = status;
        this.temperature = temperature;
        this.humidity = humidity;
        this.occupancyPresent = occupancyPresent;
        this.alertLedState = alertLedState;
        this.recordedAt = recordedAt;
        this.history = history;
    }

    get isOnline() {
        return this.status !== 'off';
    }

    get hasAlert() {
        return this.status === 'warn';
    }

    get recordedDate() {
        return this.recordedAt ? new Date(this.recordedAt) : null;
    }

    /** Local "HH:MM:SS" of the last reading, or "—". */
    get lastReadingTime() {
        const d = this.recordedDate;
        return d ? d.toLocaleTimeString('es-PE', { hour12: false }) : '—';
    }

    /** Human-readable elapsed time since the last reading (e.g. "18s", "12 min"). */
    get lastReadingAgo() {
        const d = this.recordedDate;
        if (!d) return '—';
        const secs = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
        if (secs < 60) return `${secs}s`;
        const mins = Math.floor(secs / 60);
        if (mins < 60) return `${mins} min`;
        const hours = Math.floor(mins / 60);
        return `${hours} h ${mins % 60} m`;
    }
}
