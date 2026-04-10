export class Report {
    constructor({
                    id = 0,
                    kindOfReport = '',
                    description = '',
                    resourceId = 0,
                    createdAt = '',
                    status = 'Pending'
                }) {
        this.id = id;
        this.kindOfReport = kindOfReport;
        this.description = description;
        this.resourceId = resourceId;
        this.createdAt = createdAt;
        this.status = status;
    }
}