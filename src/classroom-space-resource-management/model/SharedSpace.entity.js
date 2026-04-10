export class SharedSpace {
    constructor(id, name, capacity, description) {
        if (typeof id === 'object' && id !== null) {
            this.id = id.id;
            this.name = id.name;
            this.capacity = id.capacity;
            this.description = id.description;
        } else {
            this.id = id;
            this.name = name;
            this.capacity = capacity;
            this.description = description;
        }
    }
}