package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysMusicPlaylistMapper;
import com.ruoyi.system.domain.SysMusicPlaylist;
import com.ruoyi.system.service.ISysMusicPlaylistService;

/**
 * 专辑Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-09-25
 */
@Service
public class SysMusicPlaylistServiceImpl implements ISysMusicPlaylistService 
{
    @Autowired
    private SysMusicPlaylistMapper sysMusicPlaylistMapper;

    /**
     * 查询专辑
     * 
     * @param id 专辑主键
     * @return 专辑
     */
    @Override
    public SysMusicPlaylist selectSysMusicPlaylistById(Long id)
    {
        return sysMusicPlaylistMapper.selectSysMusicPlaylistById(id);
    }

    /**
     * 查询专辑列表
     * 
     * @param sysMusicPlaylist 专辑
     * @return 专辑
     */
    @Override
    public List<SysMusicPlaylist> selectSysMusicPlaylistList(SysMusicPlaylist sysMusicPlaylist)
    {
        return sysMusicPlaylistMapper.selectSysMusicPlaylistList(sysMusicPlaylist);
    }

    /**
     * 新增专辑
     * 
     * @param sysMusicPlaylist 专辑
     * @return 结果
     */
    @Override
    public int insertSysMusicPlaylist(SysMusicPlaylist sysMusicPlaylist)
    {
        return sysMusicPlaylistMapper.insertSysMusicPlaylist(sysMusicPlaylist);
    }

    /**
     * 修改专辑
     * 
     * @param sysMusicPlaylist 专辑
     * @return 结果
     */
    @Override
    public int updateSysMusicPlaylist(SysMusicPlaylist sysMusicPlaylist)
    {
        return sysMusicPlaylistMapper.updateSysMusicPlaylist(sysMusicPlaylist);
    }

    /**
     * 批量删除专辑
     * 
     * @param ids 需要删除的专辑主键
     * @return 结果
     */
    @Override
    public int deleteSysMusicPlaylistByIds(Long[] ids)
    {
        return sysMusicPlaylistMapper.deleteSysMusicPlaylistByIds(ids);
    }

    /**
     * 删除专辑信息
     * 
     * @param id 专辑主键
     * @return 结果
     */
    @Override
    public int deleteSysMusicPlaylistById(Long id)
    {
        return sysMusicPlaylistMapper.deleteSysMusicPlaylistById(id);
    }
}
