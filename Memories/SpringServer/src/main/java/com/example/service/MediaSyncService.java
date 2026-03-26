package com.example.service;
import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.example.config.StorageConfig;
import com.example.domain.FileMetadata;
import com.example.domain.PhotoInfo;
import com.example.mapper.FileMapper;
import com.example.mapper.PhotoMapper;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
@Component
@Slf4j
public class MediaSyncService {

    @Autowired
    private PhotoMapper photoMapper;

    @Autowired
    private FileMapper fileMapper;
    
    @Autowired
    private ExifService exifService;

    @Value("${storage.media-path}")
    private String photoStoragePath;

    @Autowired
    private StorageConfig storageConfig;
    
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
    
    public int scanAndSyncUpload() throws Exception {
    	String rootPath = storageConfig.getUploadPath();
    	Path start = Paths.get(rootPath);
        List<FileMetadata> buffer = new ArrayList<>();
        int totalCount = 0; // 定义总计数器
        try (Stream<Path> stream = Files.walk(start)) {
        	// 使用一个包装类或者直接在这里操作
            List<Path> allPaths = stream.filter(path -> !path.equals(start)).toList();
            totalCount = allPaths.size(); // 获取总数
            for (Path path : allPaths) {
                buffer.add(createMetadata(path.toFile()));
                if (buffer.size() >= 200) {
                    fileMapper.batchUpsert(buffer);
                    buffer.clear();
                }
            }
            if (!buffer.isEmpty()) fileMapper.batchUpsert(buffer);
        }
        
        return totalCount;
    }
    
    private FileMetadata createMetadata(File file) {
        FileMetadata meta = new FileMetadata();
        
        // 1. 基础属性映射
        meta.setFileName(file.getName());
        meta.setFilePath(file.getAbsolutePath());
        meta.setSize(file.length());
        meta.setIsDirectory(file.isDirectory() ? 1 : 0);
        meta.setSyncTime(LocalDateTime.now());

        // 2. 处理最后修改时间 (将 long 转为 LocalDateTime)
        LocalDateTime mTime = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(file.lastModified()), 
                ZoneId.systemDefault()
        );
        meta.setLastModified(mTime);

        // 3. 处理后缀与分类逻辑
        if (file.isDirectory()) {
            meta.setExtension(null);
            meta.setCategory("folder"); // 文件夹统一分类
        } else {
            String name = file.getName();
            String ext = "";
            
            // 提取后缀 (找最后一个点之后的内容)
            if (name.contains(".") && !name.endsWith(".")) {
                ext = name.substring(name.lastIndexOf(".") + 1).toLowerCase();
            }
            meta.setExtension(ext);
            
            // 根据后缀映射大类 (Category)
            meta.setCategory(getFileCategory(ext));
        }

        return meta;
    }
    
    private String getFileCategory(String ext) {
        return switch (ext) {
            case "jpg", "jpeg", "png", "gif", "webp" -> "image";
            case "mp4", "mkv", "avi", "mov" -> "video";
            case "mp3", "wav", "flac" -> "audio";
            case "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt" -> "doc";
            case "zip", "rar", "7z", "tar", "gz" -> "archive";
            default -> "other";
        };
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