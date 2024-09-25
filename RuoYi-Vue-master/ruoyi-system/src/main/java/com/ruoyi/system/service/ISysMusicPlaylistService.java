package com.ruoyi.system.service;

import java.util.List;
import com.ruoyi.system.domain.SysMusicPlaylist;

/**
 * 专辑Service接口
 * 
 * @author ruoyi
 * @date 2024-09-25
 */
public interface ISysMusicPlaylistService 
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
     * 批量删除专辑
     * 
     * @param ids 需要删除的专辑主键集合
     * @return 结果
     */
    public int deleteSysMusicPlaylistByIds(Long[] ids);

    /**
     * 删除专辑信息
     * 
     * @param id 专辑主键
     * @return 结果
     */
    public int deleteSysMusicPlaylistById(Long id);
}
