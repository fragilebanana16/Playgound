package com.ruoyi.system.service.impl;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.ruoyi.system.mapper.SysArtistsMapper;
import com.ruoyi.system.domain.SysArtists;
import com.ruoyi.system.service.ISysArtistsService;

/**
 * 歌手Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-09-23
 */
@Service
public class SysArtistsServiceImpl implements ISysArtistsService 
{
    @Autowired
    private SysArtistsMapper sysArtistsMapper;

    /**
     * 查询歌手
     * 
     * @param id 歌手主键
     * @return 歌手
     */
    @Override
    public SysArtists selectSysArtistsById(Long id)
    {
        return sysArtistsMapper.selectSysArtistsById(id);
    }

    /**
     * 查询歌手列表
     * 
     * @param sysArtists 歌手
     * @return 歌手
     */
    @Override
    public List<SysArtists> selectSysArtistsList(SysArtists sysArtists)
    {
        return sysArtistsMapper.selectSysArtistsList(sysArtists);
    }

    /**
     * 新增歌手
     * 
     * @param sysArtists 歌手
     * @return 结果
     */
    @Override
    public int insertSysArtists(SysArtists sysArtists)
    {
        return sysArtistsMapper.insertSysArtists(sysArtists);
    }

    /**
     * 修改歌手
     * 
     * @param sysArtists 歌手
     * @return 结果
     */
    @Override
    public int updateSysArtists(SysArtists sysArtists)
    {
        return sysArtistsMapper.updateSysArtists(sysArtists);
    }

    /**
     * 批量删除歌手
     * 
     * @param ids 需要删除的歌手主键
     * @return 结果
     */
    @Override
    public int deleteSysArtistsByIds(Long[] ids)
    {
        return sysArtistsMapper.deleteSysArtistsByIds(ids);
    }

    /**
     * 删除歌手信息
     * 
     * @param id 歌手主键
     * @return 结果
     */
    @Override
    public int deleteSysArtistsById(Long id)
    {
        return sysArtistsMapper.deleteSysArtistsById(id);
    }
}
