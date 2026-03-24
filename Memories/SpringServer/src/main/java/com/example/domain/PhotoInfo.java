package com.example.domain;

public class PhotoInfo {
    private String filename;
    private String filePath;
    private String location;
    private String thumbnailUrl;
    private String originalUrl;
    private Double lat;
    private Double lng;
    private Double altitude;
    private String shootTime;
    private String deviceModel;
    private String aperture;
    private String shutterSpeed;
    private Integer iso;
    private String focalLength;
    private Integer width;
    private Integer height;

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    public String getThumbnailUrl() { return thumbnailUrl; }
    public void setThumbnailUrl(String thumbnailUrl) { this.thumbnailUrl = thumbnailUrl; }
    public String getOriginalUrl() { return originalUrl; }
    public void setOriginalUrl(String originalUrl) { this.originalUrl = originalUrl; }
    public Double getLat() { return lat; }
    public void setLat(Double lat) { this.lat = lat; }
    public Double getLng() { return lng; }
    public void setLng(Double lng) { this.lng = lng; }
    public Double getAltitude() { return altitude; }
    public void setAltitude(Double altitude) { this.altitude = altitude; }
    public String getShootTime() { return shootTime; }
    public void setShootTime(String shootTime) { this.shootTime = shootTime; }
    public String getDeviceModel() { return deviceModel; }
    public void setDeviceModel(String deviceModel) { this.deviceModel = deviceModel; }
    public String getAperture() { return aperture; }
    public void setAperture(String aperture) { this.aperture = aperture; }
    public String getShutterSpeed() { return shutterSpeed; }
    public void setShutterSpeed(String shutterSpeed) { this.shutterSpeed = shutterSpeed; }
    public Integer getIso() { return iso; }
    public void setIso(Integer iso) { this.iso = iso; }
    public String getFocalLength() { return focalLength; }
    public void setFocalLength(String focalLength) { this.focalLength = focalLength; }
    public Integer getWidth() { return width; }
    public void setWidth(Integer width) { this.width = width; }
    public Integer getHeight() { return height; }
    public void setHeight(Integer height) { this.height = height; }
}