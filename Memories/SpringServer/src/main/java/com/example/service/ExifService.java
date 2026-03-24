package com.example.service;

import com.drew.imaging.ImageMetadataReader;
import com.drew.metadata.Metadata;
import com.drew.metadata.exif.ExifIFD0Directory;
import com.drew.metadata.exif.ExifSubIFDDirectory;
import com.drew.metadata.exif.GpsDirectory;
import com.drew.metadata.jpeg.JpegDirectory;
import com.example.domain.PhotoInfo;
import org.springframework.stereotype.Service;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.TimeZone;

@Service
public class ExifService {

    public PhotoInfo extract(File file, String filename) {
        PhotoInfo info = new PhotoInfo();
        info.setFilename(filename);
        info.setThumbnailUrl("/api/file/thumbnail/" + filename);
        info.setOriginalUrl("/api/file/preview/media/" + filename);

        try {
            Metadata metadata = ImageMetadataReader.readMetadata(file);

            // GPS 位置
            GpsDirectory gps = metadata.getFirstDirectoryOfType(GpsDirectory.class);
            if (gps != null && gps.getGeoLocation() != null) {
                info.setLat(gps.getGeoLocation().getLatitude());
                info.setLng(gps.getGeoLocation().getLongitude());
                if (gps.containsTag(GpsDirectory.TAG_ALTITUDE)) {
                    info.setAltitude(gps.getDouble(GpsDirectory.TAG_ALTITUDE));
                }
            }

            // 拍摄时间、参数
            ExifSubIFDDirectory exif = metadata.getFirstDirectoryOfType(ExifSubIFDDirectory.class);
            if (exif != null) {
            	Date date = exif.getDate(ExifSubIFDDirectory.TAG_DATETIME_ORIGINAL, TimeZone.getTimeZone("Asia/Shanghai"));
            	if (date != null) {
            	    info.setShootTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(date));
            	}
                if (exif.containsTag(ExifSubIFDDirectory.TAG_FNUMBER)) {
                    info.setAperture("f/" + exif.getString(ExifSubIFDDirectory.TAG_FNUMBER));
                }
                if (exif.containsTag(ExifSubIFDDirectory.TAG_EXPOSURE_TIME)) {
                    info.setShutterSpeed(exif.getString(ExifSubIFDDirectory.TAG_EXPOSURE_TIME) + "s");
                }
                if (exif.containsTag(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT)) {
                    info.setIso(exif.getInteger(ExifSubIFDDirectory.TAG_ISO_EQUIVALENT));
                }
                if (exif.containsTag(ExifSubIFDDirectory.TAG_FOCAL_LENGTH)) {
                    info.setFocalLength(exif.getString(ExifSubIFDDirectory.TAG_FOCAL_LENGTH) + "mm");
                }
            }

            // 设备型号
            ExifIFD0Directory ifd0 = metadata.getFirstDirectoryOfType(ExifIFD0Directory.class);
            if (ifd0 != null) {
                String make = ifd0.getString(ExifIFD0Directory.TAG_MAKE);
                String model = ifd0.getString(ExifIFD0Directory.TAG_MODEL);
                if (make != null && model != null) {
                    info.setDeviceModel(make.trim() + " " + model.trim());
                } else if (model != null) {
                    info.setDeviceModel(model.trim());
                }
            }

            // 分辨率
            JpegDirectory jpeg = metadata.getFirstDirectoryOfType(JpegDirectory.class);
            if (jpeg != null) {
                if (jpeg.containsTag(JpegDirectory.TAG_IMAGE_WIDTH)) {
                    info.setWidth(jpeg.getInteger(JpegDirectory.TAG_IMAGE_WIDTH));
                }
                if (jpeg.containsTag(JpegDirectory.TAG_IMAGE_HEIGHT)) {
                    info.setHeight(jpeg.getInteger(JpegDirectory.TAG_IMAGE_HEIGHT));
                }
            }

        } catch (Exception e) {
            System.out.println("EXIF 读取失败：" + filename + " " + e.getMessage());
        }

        return info;
    }
}