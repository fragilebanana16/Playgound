package com.ruoyi.system.mapper;

import java.util.List;
import com.ruoyi.system.domain.SysMusicPlaylist;

/**
 * 专辑Mapper接口
 * 
 * @author ruoyi
 * @date 2024-09-25
 */
public interface SysMusicPlaylistMapper 
{
    /**
     * 查询专辑
     * 
     * @param id 专辑主键
     * @return 专辑
     */
    public SysMusicPlaylist selectSysMusicPlaylistById(Long id);

    /**
     * 查询专辑列表
     * 
     * @param sysMusicPlaylist 专辑
     * @return 专辑集合
     */
    public List<SysMusicPlaylist> selectSysMusicPlaylistList(SysMusicPlaylist sysMusicPlaylist);

    /**
     * 新增专辑
     * 
     * @param sysMusicPlaylist 专辑
     * @return 结果
     */
    public int insertSysMusicPlaylist(SysMusicPlaylist sysMusicPlaylist);

    /**
     * 修改专辑
     * 
     * @param sysMusicPlaylist 专辑
     * @return 结果
     */
    public int updateSysMusicPlaylist(SysMusicPlaylist sysMusicPlaylist);

    /**
     * 删除专辑
     * 
     * @param id 专辑主键
     * @return 结果
     */
    public int deleteSysMusicPlaylistById(Long id);

    /**
     * 批量删除专辑
     * 
     * @param ids 需要删除的数据主键集合
     * @return 结果
     */
    public int deleteSysMusicPlaylistByIds(Long[] ids);
}
