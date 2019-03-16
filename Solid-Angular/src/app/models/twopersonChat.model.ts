import { Message } from './message.model';

export class TwoPersonChat {

    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    id: string;
    messages: Message[] = new Array();
    person: string[] = new Array(); // Array de WebIds
    name: string;    
}
