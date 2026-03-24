package com.example.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;

@Service
public class FileStorageService {

    @Value("${storage.upload-path:uploads}")
    private String uploadPath;

    // 保存文件字节
    public Path save(String originalName, byte[] bytes) throws Exception {
        Path dir = getDatePath();
        Files.createDirectories(dir);
        String savedName = buildFilename(originalName);
        Path target = dir.resolve(savedName);
        Files.write(target, bytes);
        return target;
    }

    // 保存分片
    public void saveChunk(String md5, int index, byte[] bytes) throws Exception {
        Path chunkDir = getChunkDir(md5);
        Files.createDirectories(chunkDir);
        Path chunkFile = chunkDir.resolve(String.valueOf(index));
        Files.write(chunkFile, bytes);
    }

    // 合并分片
    public Path mergeChunks(String md5, String filename, int total) throws Exception {
        Path chunkDir = getChunkDir(md5);
        Path target = getDatePath().resolve(buildFilename(filename));
        Files.createDirectories(target.getParent());

        try (OutputStream out = new FileOutputStream(target.toFile())) {
            for (int i = 0; i < total; i++) {
            	Path chunk = chunkDir.resolve(String.valueOf(i));
                Files.copy(chunkDir.resolve(String.valueOf(i)), out);
            }
        }

        deleteDir(chunkDir);
        return target;
    }

    // 查已上传的分片序号
    public java.util.List<Integer> getUploadedChunks(String md5) throws Exception {
        Path chunkDir = getChunkDir(md5);
        java.util.List<Integer> list = new java.util.ArrayList<>();
        if (!Files.exists(chunkDir)) return list;
        Files.list(chunkDir).forEach(p -> {
            try { list.add(Integer.parseInt(p.getFileName().toString())); }
            catch (NumberFormatException ignored) {}
        });
        return list;
    }

    // 在所有子目录里找文件
    public Path findFile(String filename, String rootPath) throws Exception {
        Path root = Paths.get(rootPath);
        if (!Files.exists(root)) return null;
        return Files.walk(root)
                .filter(p -> p.getFileName().toString().equals(filename))
                .findFirst().orElse(null);
    }

    // 保存 md5 记录
    public void saveMd5Record(String md5, Path filePath) throws Exception {
        Path record = Paths.get(uploadPath, "md5.txt");
        Files.writeString(record, md5 + "=" + filePath + "\n",
                StandardOpenOption.CREATE, StandardOpenOption.APPEND);
    }

    // 根据 md5 查文件
    public Path findByMd5(String md5) throws Exception {
        Path record = Paths.get(uploadPath, "md5.txt");
        if (!Files.exists(record)) return null;
        for (String line : Files.readAllLines(record)) {
            if (line.startsWith(md5 + "=")) {
                Path p = Paths.get(line.split("=", 2)[1]);
                if (Files.exists(p)) return p;
            }
        }
        return null;
    }

    // 按年月生成目录
    public Path getDatePath() {
        String month = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        return Paths.get(uploadPath, month);
    }

    // 生成带时间戳的文件名
    public String buildFilename(String original) {
        String ext = "";
        int dot = original.lastIndexOf(".");
        if (dot >= 0) ext = original.substring(dot);
        return System.currentTimeMillis() + ext;
    }

    public Path getChunkDir(String md5) {
        return Paths.get(uploadPath, "chunks", md5);
    }

    public void deleteDir(Path dir) throws Exception {
        Files.walk(dir)
                .sorted(Comparator.reverseOrder())
                .map(Path::toFile)
                .forEach(File::delete);
    }
}