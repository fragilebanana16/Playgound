package com.example.service;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.example.domain.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ChatService {

    @Autowired
    private UserSessionService userSessionService;

    @Autowired
    private SocketIOServer server;

    // 处理私聊消息
    public void handlePrivateMsg(SocketIOClient client, ChatMessage msg) {
        String from = client.get("username");
        if (from == null) return;

        msg.setFrom(from);

        // 发给目标用户
        SocketIOClient target = userSessionService.getClient(msg.getTo());
        if (target != null) {
            target.sendEvent("privateMsg", msg);
        }

        // 发回给自己（显示在自己的聊天框）
        client.sendEvent("privateMsg", msg);
    }

    // 广播用户列表给所有人
    public void broadcastUserList() {
        String userList = userSessionService.buildUserList();
        server.getBroadcastOperations().sendEvent("userList", userList);
    }
}