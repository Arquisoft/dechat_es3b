export class Message {

    makerWebId: string;
    message: string;
    sendTime: Date = new Date();
    constructor(message) {
        this.message = message;
    }

    public toString(): String {
        return this.message;
    }
}
