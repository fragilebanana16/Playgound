package com.example.domain;

import java.time.LocalDateTime;

public class ChatMessage {
    private String from;
    private String to;
    private String content;
    private String type; // text / image
    private LocalDateTime timestamp;

    public ChatMessage() {}

    public ChatMessage(String from, String to, String content) {
        this.from = from;
        this.to = to;
        this.content = content;
        this.type = "text";
        this.timestamp = LocalDateTime.now();
    }

    public String getFrom() { return from; }
    public void setFrom(String from) { this.from = from; }
    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}