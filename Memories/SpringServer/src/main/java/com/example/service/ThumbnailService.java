package com.example.service;

import net.coobird.thumbnailator.Thumbnails;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.OutputStream;

@Service
public class ThumbnailService {

    private static final int THUMB_SIZE = 200;

    public void writeThumbnail(File file, OutputStream out) throws Exception {
        Thumbnails.of(file)
                .size(THUMB_SIZE, THUMB_SIZE)
                .keepAspectRatio(true)
                .outputFormat("jpg")
                .outputQuality(0.85)
                .toOutputStream(out);
    }
}