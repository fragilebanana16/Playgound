package com.ruoyi.system.service;

import java.util.List;

import org.springframework.http.ResponseEntity;

import com.ruoyi.common.core.domain.entity.SysVideo;

/**
 * 用户 业务层
 * 
 * @author 
 */
public interface ISysVideoService
{
    public List<SysVideo> getVideos();

    public ResponseEntity<byte[]> prepareContent(final String fileName, final String fileType, final String range);
}
