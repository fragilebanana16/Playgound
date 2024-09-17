package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysArtists;

/**
 * 歌手Mapper接口
 * 
 * @author ruoyi
 * @date 2024-09-17
 */
public interface SysArtistsMapper 
{
    /**
     * 查询歌手
     * 
     * @param id 歌手主键
     * @return 歌手
     */
    public SysArtists selectSysArtistsById(Long id);

    /**
     * 查询歌手
     * 
     * @param id 歌手名
     * @return 歌手
     */
    public SysArtists selectSysArtistsByName(String name);
    
    /**
     * 查询歌手列表
     * 
     * @param sysArtists 歌手
     * @return 歌手集合
     */
    public List<SysArtists> selectSysArtistsList(SysArtists sysArtists);

    /**
     * 新增歌手
     * 
     * @param sysArtists 歌手
     * @return 结果
     */
    public int insertSysArtists(SysArtists sysArtists);

    /**
     * 修改歌手
     * 
     * @param sysArtists 歌手
     * @return 结果
     */
    public int updateSysArtists(SysArtists sysArtists);

    /**
     * 删除歌手
     * 
     * @param id 歌手主键
     * @return 结果
     */
    public int deleteSysArtistsById(Long id);

    /**
     * 批量删除歌手
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysArtistsByIds(Long[] ids);
}
