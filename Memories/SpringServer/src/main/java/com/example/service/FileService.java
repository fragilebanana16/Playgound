package com.example.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.config.StorageConfig;
import com.example.domain.FileMetadata;
import com.example.mapper.FileMapper;

import lombok.extern.slf4j.Slf4j;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
@Slf4j
@Service
public class FileService {

    @Autowired
    private FileStorageService storageService;
    @Autowired
    private StorageConfig storageConfig;
    @Autowired
    private FileMapper fileMapper;
    
    public Map<String, Object> getFilesByPage(int page, int size) {
        int offset = (page - 1) * size;
        List<FileMetadata> list = fileMapper.selectPage(offset, size);
        long total = fileMapper.countAll();

        Map<String, Object> result = new HashMap<>();
        result.put("items", list);
        result.put("total", total);
        return result;
    }
    
    // 普通上传
    public Map<String, Object> upload(MultipartFile file) throws Exception {
    	log.info("upload==>");
        Path saved = storageService.save(file.getOriginalFilename(), file.getBytes());
        return buildResult(saved.getFileName().toString());
    }

    // 秒传检查
    public Map<String, Object> check(String md5, String filename) throws Exception {
        Path existing = storageService.findByMd5(md5);
        Map<String, Object> res = new HashMap<>();
        if (existing != null) {
            res.put("exist", true);
            res.put("url", "/file/preview/upload" + existing.getFileName());
            res.put("downloadUrl", "/file/download/" + existing.getFileName());
        } else {
            res.put("exist", false);
        }
        return res;
    }

    // 上传分片
    public void uploadChunk(byte[] bytes, String md5, int index) throws Exception {
        storageService.saveChunk(md5, index, bytes);
    }

    // 查已上传分片
    public List<Integer> getUploadedChunks(String md5) throws Exception {
        return storageService.getUploadedChunks(md5);
    }

    // 合并分片
    public Map<String, Object> merge(String md5, String filename, int total) throws Exception {
        Path merged = storageService.mergeChunks(md5, filename, total);
        storageService.saveMd5Record(md5, merged);
        return buildResult(merged.getFileName().toString());
    }
    
    public Path findMediaFile(String filename)  throws Exception{
        return storageService.findFile(filename, storageConfig.getMediaPath());
    }
    
    // 查找文件（下载/预览用）
    public Path findUploadFile (String filename)  throws Exception{
        return storageService.findFile(filename, storageConfig.getUploadPath());
    }

    private Map<String, Object> buildResult(String filename) {
        Map<String, Object> res = new HashMap<>();
        res.put("filename", filename);
        res.put("url", "/file/preview/upload" + filename);
        res.put("downloadUrl", "/file/download/" + filename);
        return res;
    }
}