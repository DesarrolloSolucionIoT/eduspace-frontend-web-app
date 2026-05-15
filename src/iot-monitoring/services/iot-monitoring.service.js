import mockDb from './db.json';

export class IotMonitoringService {
    getSpaces() {
        return Promise.resolve({ data: mockDb.spaces });
    }

    getSpaceById(spaceId) {
        const space = mockDb.spaces.find(s => s.id === spaceId);
        return Promise.resolve({ data: space || null });
    }

    getAlerts() {
        const alerts = mockDb.spaces
            .filter(s => s.status === 'warn' || s.status === 'danger')
            .map(s => ({
                spaceId: s.id,
                spaceName: s.name,
                status: s.status,
                meta: s.meta,
                lastEvent: s.events?.[0] || null,
            }));
        return Promise.resolve({ data: alerts });
    }
}
