export class Reservation {
    constructor({id, title, start, end, areaId, teacherId}) {
        this.id = id;
        this.title = title;
        this.start = start;
        this.end = end;
        this.areaId = areaId;
        this.teacherId = teacherId;
    }
}