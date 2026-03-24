package com.example.handler;

import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.SocketIOClient;
import com.example.service.ChatService;
import com.example.service.UserSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import jakarta.annotation.PostConstruct;

@Component
public class UserHandler {

    @Autowired
    private SocketIOServer server;

    @Autowired
    private UserSessionService userSessionService;

    @Autowired
    private ChatService chatService;

    @PostConstruct
    public void init() {
        // 登录
        server.addEventListener("login", String.class,
            (client, username, ack) -> onLogin(client, username));

        // 断开
        server.addDisconnectListener(this::onDisconnect);
    }

    private void onLogin(SocketIOClient client, String username) {
        userSessionService.bind(username, client);
        System.out.println(username + " 登录");
        chatService.broadcastUserList();
    }

    private void onDisconnect(SocketIOClient client) {
        String username = userSessionService.unbind(client);
        if (username != null) {
            System.out.println(username + " 离线");
            chatService.broadcastUserList();
        }
    }
}