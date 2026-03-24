package com.example.handler;

import com.corundumstudio.socketio.SocketIOServer;
import com.example.domain.ChatMessage;
import com.example.service.ChatService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class ChatHandler {

    @Autowired
    private SocketIOServer server;

    @Autowired
    private ChatService chatService;

    @PostConstruct
    public void init() {
        server.addEventListener("privateMsg", ChatMessage.class,
            (client, msg, ack) -> chatService.handlePrivateMsg(client, msg));
    }
}