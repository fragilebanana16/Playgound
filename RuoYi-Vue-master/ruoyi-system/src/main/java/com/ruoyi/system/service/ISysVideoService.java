package com.ruoyi.system.service;

import java.io.IOException;
import java.util.List;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.http.ResponseEntity;

import com.ruoyi.system.domain.SysVideo;

/**
 * 用户 业务层
 * 
 * @author 
 */
public interface ISysVideoService
{
    public List<SysVideo> getVideos();

    // 重新生成封面、配置
    public boolean reafreshVideoInfo();
    
    // https://www.codeproject.com/Articles/5341970/Streaming-Media-Files-in-Spring-Boot-Web-Applicati
    ResponseEntity<StreamingResponseBody> 
    loadEntireMediaFile(String localMediaFilePath) throws IOException;

	ResponseEntity<StreamingResponseBody> loadPartialMediaFile
	(String localMediaFilePath, String rangeValues) throws IOException;
	
	ResponseEntity<StreamingResponseBody> loadPartialMediaFile
	(String localMediaFilePath, long fileStartPos, long fileEndPos) throws IOException;
	
    /**
     * 查询影视
     * 
     * @param videoId 影视主键
     * @return 影视
     */
    public SysVideo selectSysVideoByVideoId(Long videoId);

    /**
     * 查询影视列表
     * 
     * @param sysVideo 影视
     * @return 影视集合
     */
    public List<SysVideo> selectSysVideoList(SysVideo sysVideo);

    /**
     * 新增影视
     * 
     * @param sysVideo 影视
     * @return 结果
     */
    public int insertSysVideo(SysVideo sysVideo);

    /**
     * 修改影视
     * 
     * @param sysVideo 影视
     * @return 结果
     */
    public int updateSysVideo(SysVideo sysVideo);

    /**
     * 批量删除影视
     * 
     * @param videoIds 需要删除的影视主键集合
     * @return 结果
     */
    public int deleteSysVideoByVideoIds(Long[] videoIds);

    /**
     * 删除影视信息
     * 
     * @param videoId 影视主键
     * @return 结果
     */
    public int deleteSysVideoByVideoId(Long videoId);
}
