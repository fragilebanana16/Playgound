package com.example.service;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.example.domain.PhotoInfo;
import com.example.mapper.PhotoMapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class PhotoSyncService {

    @Autowired
    private PhotoMapper photoMapper;

    @Autowired
    private ExifService exifService;

    @Value("${storage.media-path}")
    private String photoStoragePath;

    // 启动时执行一次
    @PostConstruct
    public void syncOnStartup() {
        sync();
    }
    
    private boolean isImage(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg")
            || lower.endsWith(".png") || lower.endsWith(".webp");
    }
    
    public void sync() {
        Path root = Paths.get(photoStoragePath);
        if (!Files.exists(root)) return;

        try {
            Files.walk(root)
                .filter(p -> isImage(p.getFileName().toString()))
                .forEach(p -> {
                    String filename = p.getFileName().toString();
                    // 已存在就跳过
                    if (photoMapper.existsByFilename(filename)) return;
                    
                    PhotoInfo info = exifService.extract(p.toFile(), filename);
                    if (info.getLat() != null && info.getLng() != null) {
                        photoMapper.insert(info);
                    }
                });
        } catch (Exception e) {
        	log.error("照片同步失败", e);
        }
    }
}