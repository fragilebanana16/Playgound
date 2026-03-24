package com.example.service;

import com.example.domain.PhotoInfo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

@Service
public class PhotoService {

    @Autowired
    private ExifService exifService;

    @Value("${storage.media-path}")
    private String photoStoragePath;
    
    // 扫描所有上传图片，返回有GPS信息的
    public List<PhotoInfo> listPhotosWithLocation() throws Exception {
        List<PhotoInfo> result = new ArrayList<>();
        Path root = Paths.get(photoStoragePath);
        if (!Files.exists(root)) return result;

        Files.walk(root)
            .filter(p -> isImage(p.getFileName().toString()))
            .forEach(p -> {
                PhotoInfo info = exifService.extract(p.toFile(), p.getFileName().toString());
                // 只返回有 GPS 信息的
                if (info.getLat() != null && info.getLng() != null) {
                    result.add(info);
                }
            });

        return result;
    }

    private boolean isImage(String filename) {
        String lower = filename.toLowerCase();
        return lower.endsWith(".jpg") || lower.endsWith(".jpeg")
            || lower.endsWith(".png") || lower.endsWith(".heic");
    }
}