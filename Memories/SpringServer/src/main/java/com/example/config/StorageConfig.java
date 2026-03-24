package com.example.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "storage")
public class StorageConfig {

    /** 媒体文件存储路径 */
    private String mediaPath = "G:/media";

    /** 上传文件存储路径 */
    private String uploadPath = "uploads";

    public String getMediaPath() { return mediaPath; }
    public void setMediaPath(String mediaPath) { this.mediaPath = mediaPath; }

    public String getUploadPath() { return uploadPath; }
    public void setUploadPath(String uploadPath) { this.uploadPath = uploadPath; }
}