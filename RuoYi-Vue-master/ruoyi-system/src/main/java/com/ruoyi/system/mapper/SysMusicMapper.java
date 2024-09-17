package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysMusic;

/**
 * 歌曲Mapper接口
 * 
 * @author ruoyi
 * @date 2024-09-16
 */
public interface SysMusicMapper 
{
    /**
     * 查询歌曲
     * 
     * @param musicId 歌曲主键
     * @return 歌曲
     */
    public SysMusic selectSysMusicByMusicId(Long musicId);

    /**
     * 查询歌曲列表
     * 
     * @param sysMusic 歌曲
     * @return 歌曲集合
     */
    public List<SysMusic> selectSysMusicList(SysMusic sysMusic);

    /**
     * 新增歌曲
     * 
     * @param sysMusic 歌曲
     * @return 结果
     */
    public int insertSysMusic(SysMusic sysMusic);

    /**
     * 修改歌曲
     * 
     * @param sysMusic 歌曲
     * @return 结果
     */
    public int updateSysMusic(SysMusic sysMusic);

    /**
     * 删除歌曲
     * 
     * @param musicId 歌曲主键
     * @return 结果
     */
    public int deleteSysMusicByMusicId(Long musicId);

    /**
     * 批量删除歌曲
     * 
     * @param musicIds 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysMusicByMusicIds(Long[] musicIds);
    

    /**
     * 重置曲库
     * 
     * @return 结果
     */
    public void deleteSysMusic();
}
