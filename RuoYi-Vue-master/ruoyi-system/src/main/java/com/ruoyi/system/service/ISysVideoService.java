package com.ruoyi.system.service;

import java.io.IOException;
import java.util.List;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
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

    // https://www.codeproject.com/Articles/5341970/Streaming-Media-Files-in-Spring-Boot-Web-Applicati
    ResponseEntity<StreamingResponseBody> 
    loadEntireMediaFile(String localMediaFilePath) throws IOException;

	ResponseEntity<StreamingResponseBody> loadPartialMediaFile
	(String localMediaFilePath, String rangeValues) throws IOException;
	
	ResponseEntity<StreamingResponseBody> loadPartialMediaFile
	(String localMediaFilePath, long fileStartPos, long fileEndPos) throws IOException;
}
