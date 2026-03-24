package com.example.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.OutputStream;

@Service
public class ThumbnailService {
    public void writeThumbnail(File file, OutputStream out, float  quality, int size) throws Exception {
        Thumbnails.of(file)
                .size(size, size)
                .keepAspectRatio(true)
                .outputFormat("jpg")
                .outputQuality(quality)
                .toOutputStream(out);
    }
}