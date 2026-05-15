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
    }

    get isOnline() {
        return this.status !== 'off';
    }

    get hasAlert() {
        return this.status === 'warn' || this.status === 'danger';
    }

    get buildingPrefix() {
        return this.id.split('-')[0];
    }
}
