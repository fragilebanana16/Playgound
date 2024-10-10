package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysVideo;
import com.ruoyi.system.domain.SysVideoCategory;

/**
 * 影视Mapper接口
 * 
 * @author ruoyi
 * @date 2024-08-18
 */
public interface SysVideoMapper 
{
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
    
    public List<SysVideo> selectTrendingSysVideoList(SysVideo sysVideo);

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
     * 删除影视
     * 
     * @param videoId 影视主键
     * @return 结果
     */
    public int deleteSysVideoByVideoId(Long videoId);

    /**
     * 批量删除影视
     * 
     * @param videoIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysVideoByVideoIds(Long[] videoIds);

    /**
     * 批量删除影视目录
     * 
     * @param videoIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysVideoCategoryByCategoryIds(Long[] videoIds);
    
    /**
     * 批量新增影视目录
     * 
     * @param sysVideoCategoryList 影视目录列表
     * @return 结果
     */
    public int batchSysVideoCategory(List<SysVideoCategory> sysVideoCategoryList);
    

    /**
     * 通过影视主键删除影视目录信息
     * 
     * @param videoId 影视ID
     * @return 结果
     */
    public int deleteSysVideoCategoryByCategoryId(Long videoId);
    

    /**
     * 重置视频库
     * 
     * @return 结果
     */
    public void deleteSysVideo();
}
