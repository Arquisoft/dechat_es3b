import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgForm } from '@angular/forms';
import { SolidProfile } from '../models/solid-profile.model';
import { RdfService } from '../services/rdf.service';
import { ChatService } from '../services/chat.service';
import { AuthService } from '../services/solid.auth.service';

import { TwoPersonChat } from '../models/twopersonChat.model';
import { Message } from '../models/message.model';
import { templateJitUrl } from '@angular/compiler';
import { stringify } from 'querystring';

@Component({
  selector: 'app-card',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent implements OnInit  {

  twopersonChat: TwoPersonChat;

  constructor(private rdf: RdfService,
    private route: ActivatedRoute, private auth: AuthService, private chatService: ChatService) {}

  async ngOnInit() {
    await this.chatService.init();
  }

  async sendMessage() {
    const inputElement: HTMLInputElement = document.getElementById('input_text') as HTMLInputElement;
    const msg: string = inputElement.value;

    let message: Message = new Message(msg);
    
    this.chatService.sendMessage(this.twopersonChat, message);
  }

  addChat() {
    const inputElement: HTMLInputElement = document.getElementById('input_add_webid') as HTMLInputElement;
    const webid: string = inputElement.value;
    this.chatService.createChat(webid);
  }

  
}
