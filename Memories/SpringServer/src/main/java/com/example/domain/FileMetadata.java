package com.example.domain;
import java.time.LocalDateTime;

public class FileMetadata {
    private Long id;
    private String fileName;
    private String filePath;
    private Long size;
    private String extension;
    private Integer isDirectory; // 0-文件, 1-目录
    private LocalDateTime lastModified;
    private LocalDateTime syncTime;
    private String category;
    
    // Getter and Setter (建议使用 Lombok @Data 简化)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }
    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }
    public Integer getIsDirectory() { return isDirectory; }
    public void setIsDirectory(Integer isDirectory) { this.isDirectory = isDirectory; }
    public LocalDateTime getLastModified() { return lastModified; }
    public void setLastModified(LocalDateTime lastModified) { this.lastModified = lastModified; }
    public LocalDateTime getSyncTime() { return syncTime; }
    public void setSyncTime(LocalDateTime syncTime) { this.syncTime = syncTime; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
