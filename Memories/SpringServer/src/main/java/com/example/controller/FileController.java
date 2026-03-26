package com.example.controller;

import com.example.service.FileService;
import com.example.service.PhotoService;
import com.example.service.MediaSyncService;
import com.example.service.ThumbnailService;
import com.example.domain.PhotoInfo;
import com.example.mapper.PhotoMapper;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.*;
import java.util.List;
import java.util.Map;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import java.io.RandomAccessFile;

@RestController
@RequestMapping("/file")
public class FileController {

    @Autowired
    private FileService fileService;
    
    @Autowired
    private PhotoService photoService;
    
    @Autowired
    private MediaSyncService mediaSyncService;
    
    @Autowired
    private ThumbnailService thumbnailService;
    
    @Autowired
    private PhotoMapper photoMapper;

    @GetMapping("/fileMetas")
    public Map<String, Object> list(@RequestParam(defaultValue = "1") int page, 
                                    @RequestParam(defaultValue = "50") int size) {
        return fileService.getFilesByPage(page, size);
    }
    
    @PostMapping("/upload")
    public Map<String, Object> upload(@RequestParam("file") MultipartFile file) throws Exception {
        return fileService.upload(file);
    }
    
    @PostMapping("/syncUpload")
    public ResponseEntity<String> syncLocalFiles() {
        try {
        	int cnt = mediaSyncService.scanAndSyncUpload();
            return ResponseEntity.ok("同步成功！" + cnt + "条");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("同步失败: " + e.getMessage());
        }
    }
    
    @GetMapping("/check")
    public Map<String, Object> check(@RequestParam String md5,
                                     @RequestParam String filename) throws Exception {
        return fileService.check(md5, filename);
    }

    @GetMapping("/chunks")
    public Map<String, Object> uploadedChunks(@RequestParam String md5) throws Exception {
        return Map.of("uploaded", fileService.getUploadedChunks(md5));
    }

    @PostMapping("/chunk")
    public Map<String, Object> uploadChunk(@RequestParam("file") MultipartFile file,
                                           @RequestParam String md5,
                                           @RequestParam int index,
                                           @RequestParam int total) throws Exception {
        fileService.uploadChunk(file.getBytes(), md5, index);
        return Map.of("index", index);
    }

    @PostMapping("/merge")
    public Map<String, Object> merge(@RequestParam String md5,
                                     @RequestParam String filename,
                                     @RequestParam int total) throws Exception {
        return fileService.merge(md5, filename, total);
    }
    
    // 获取所有带 GPS 的图片信息
    @GetMapping("/photos")
    public List<PhotoInfo> listPhotos() throws Exception {
        return photoService.listPhotosWithLocation();
    }
    

    @GetMapping("/day")
    public List<Map<String, Object>> getDay(@RequestParam Long dayId) {
        return photoMapper.findTimelineDay(dayId);
    }
    
    @GetMapping("/days")
    public List<Map<String, Object>> getDays() {
        return photoMapper.findGroupByDay();
    }
    
    @GetMapping("/photosBbox")
    public List<PhotoInfo> list(
        @RequestParam Double west,
        @RequestParam Double east,
        @RequestParam Double south,
        @RequestParam Double north,
        @RequestParam(defaultValue = "500") int limit
    ) {
        return photoMapper.findByBbox(west, east, south, north, limit);
    }

    // 获取缩略图（动态生成，不落盘）
    @GetMapping("/thumbnail/{filename}")
    public void thumbnail(@PathVariable String filename, @RequestParam(defaultValue = "0.8f") float quality, @RequestParam(defaultValue = "200") int size, HttpServletResponse response) throws Exception {
        Path file = fileService.findMediaFile(filename);
        if (file == null) {
            response.setStatus(404);
            return;
        }
        response.setContentType("image/jpeg");
        // 浏览器缓存 1 天
        response.setHeader("Cache-Control", "max-age=86400");
        thumbnailService.writeThumbnail(file.toFile(), response.getOutputStream(), quality, size);
    }
    
    @GetMapping("/preview/{type}/{filename}")
    public ResponseEntity<Resource> preview(
            @PathVariable String type,
            @PathVariable String filename) throws Exception {
        return buildResponse(type, filename, "inline");
    }

    @GetMapping("/download/{filename}")
    public ResponseEntity<Resource> download(@PathVariable String filename) throws Exception {
        return buildResponse("upload", filename, "attachment");
    }

    private ResponseEntity<Resource> buildResponse(String type, String filename, String disposition) throws Exception {
        // 根据类型找不同目录
        Path file = switch (type) {
            case "media"  -> fileService.findMediaFile(filename);
            case "upload" -> fileService.findUploadFile(filename);
            default -> null;
        };
        
        if (file == null || !Files.exists(file)) 
            return ResponseEntity.notFound().build();

        long fileSize = Files.size(file);
        String contentType = Files.probeContentType(file);
        if (contentType == null) contentType = "application/octet-stream";

        // 读取请求头里的 Range
        HttpServletRequest request = ((ServletRequestAttributes)
            RequestContextHolder.getRequestAttributes()).getRequest();
        String rangeHeader = request.getHeader("Range");

        // 没有 Range 请求，正常返回整个文件（小文件/图片）
        if (rangeHeader == null) {
            Resource resource = new UrlResource(file.toUri());
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            disposition + "; filename=\"" + filename + "\"")
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(resource);
        }

        // 解析 Range: bytes=start-end
        String range = rangeHeader.replace("bytes=", "");
        String[] parts = range.split("-");
        long start = Long.parseLong(parts[0]);
        long end = parts.length > 1 && !parts[1].isEmpty()
                ? Long.parseLong(parts[1])
                : Math.min(start + 1024 * 1024 - 1, fileSize - 1); // 默认每次返回 1MB

        long contentLength = end - start + 1;

        // 只读文件的这一段
        byte[] data = new byte[(int) contentLength];
        try (RandomAccessFile raf = new RandomAccessFile(file.toFile(), "r")) {
            raf.seek(start);
            raf.read(data);
        }

        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT) // 206
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        disposition + "; filename=\"" + filename + "\"")
                .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                .header(HttpHeaders.CONTENT_RANGE,
                        "bytes " + start + "-" + end + "/" + fileSize)
                .contentLength(contentLength)
                .body(new ByteArrayResource(data));
    }
}
