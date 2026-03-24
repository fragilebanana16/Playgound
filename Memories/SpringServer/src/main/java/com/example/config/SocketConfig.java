package com.example.config;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import org.springframework.context.annotation.Bean;

@org.springframework.context.annotation.Configuration
public class SocketConfig {

    @Bean
    public SocketIOServer socketIOServer() {
        Configuration config = new Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(9092);
        config.setOrigin("*");
        return new SocketIOServer(config);
    }
}