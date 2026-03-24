package com.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.core.env.Environment;
import com.corundumstudio.socketio.SocketIOServer;
import java.net.InetAddress;
@SpringBootApplication
public class MyApplication {
    public static void main(String[] args) throws Exception {
        ConfigurableApplicationContext context = SpringApplication.run(MyApplication.class, args);
        Environment env = context.getEnvironment();
        String port = env.getProperty("server.port");
        String ip = InetAddress.getLocalHost().getHostAddress();

        // 启动 Socket.IO
        SocketIOServer socketServer = context.getBean(SocketIOServer.class);
        socketServer.start();
        System.out.println("======== 启动成功 ========");
        System.out.println("本机：http://localhost:" + port);
        System.out.println("局域网：http://" + ip + ":" + port);
        System.out.println("Socket.IO 端口：9092");
    }
}
