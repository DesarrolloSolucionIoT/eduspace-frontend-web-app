export class IotSpace {
    constructor({
        id = '',
        name = '',
        status = 'off',
        temperature = null,
        meta = '',
        location = '',
        session = '',
        deviceCode = '',
        firmware = '',
        rssi = null,
        lastReadingTime = '',
        lastReadingAgo = '',
        sensors = {},
        events = [],
        isLive = false,
    }) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.temperature = temperature;
        this.meta = meta;
        this.location = location;
        this.session = session;
        this.deviceCode = deviceCode;
        this.firmware = firmware;
        this.rssi = rssi;
        this.lastReadingTime = lastReadingTime;
        this.lastReadingAgo = lastReadingAgo;
        this.sensors = sensors;
        this.events = events;
        this.isLive = isLive;
    }

    get isOnline() {
        return this.status !== 'off';
    }

    get hasAlert() {
        return this.status === 'warn' || this.status === 'danger';
    }

    get buildingPrefix() {
        return String(this.id).split('-')[0];
    }

    get occupancyLabel() {
        const occ = this.sensors?.occupancy;
        if (!occ || occ.value === null) return '—';
        // Real data: PIR bool (occupancyPresent)
        if (this.isLive) return occ.occupancyPresent ? 'Ocupado' : 'Libre';
        // Mock data: numeric count
        if (occ.capacity) return `${occ.value} / ${occ.capacity}`;
        return String(occ.value);
    }
}
