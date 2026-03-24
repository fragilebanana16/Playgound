package com.example.service;

import com.corundumstudio.socketio.SocketIOClient;
import org.springframework.stereotype.Service;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class UserSessionService {

    // username → client
    private final Map<String, SocketIOClient> sessionMap = new ConcurrentHashMap<>();

    // 用户上线
    public void bind(String username, SocketIOClient client) {
        client.set("username", username);
        sessionMap.put(username, client);
    }

    // 用户下线
    public String unbind(SocketIOClient client) {
        String username = client.get("username");
        if (username != null) {
            sessionMap.remove(username);
        }
        return username;
    }

    // 获取某个用户的 client
    public SocketIOClient getClient(String username) {
        return sessionMap.get(username);
    }

    // 获取所有在线用户名
    public Collection<String> getOnlineUsers() {
        return sessionMap.keySet();
    }

    // 广播用户列表
    public String buildUserList() {
        return String.join(",", sessionMap.keySet());
    }
}