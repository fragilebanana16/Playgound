package com.ruoyi.web.controller.system;

import java.util.List;
import javax.servlet.http.HttpServletResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.annotation.Log;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.enums.BusinessType;
import com.ruoyi.system.domain.SysMusic;
import com.ruoyi.system.service.ISysMusicService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 歌曲Controller
 * 
 * @author ruoyi
 * @date 2024-09-16
 */
@RestController
@RequestMapping("/system/music")
public class SysMusicController extends BaseController
{
    @Autowired
    private ISysMusicService sysMusicService;
    
    /**
     * 查询歌曲列表(本地目录)
     */
    @GetMapping("/localMovies")
    public int reset() {
        return sysMusicService.resetDbByLocalMusic();
    }
    
    /**
     * 查询歌曲列表(数据库)
     */
    @PreAuthorize("@ss.hasPermi('system:music:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysMusic sysMusic)
    {
        startPage();
        List<SysMusic> list = sysMusicService.selectSysMusicList(sysMusic);
        return getDataTable(list);
    }

    /**
     * 导出歌曲列表
     */
    @PreAuthorize("@ss.hasPermi('system:music:export')")
    @Log(title = "歌曲", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysMusic sysMusic)
    {
        List<SysMusic> list = sysMusicService.selectSysMusicList(sysMusic);
        ExcelUtil<SysMusic> util = new ExcelUtil<SysMusic>(SysMusic.class);
        util.exportExcel(response, list, "歌曲数据");
    }

    /**
     * 获取歌曲详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:music:query')")
    @GetMapping(value = "/{musicId}")
    public AjaxResult getInfo(@PathVariable("musicId") Long musicId)
    {
        return success(sysMusicService.selectSysMusicByMusicId(musicId));
    }

    /**
     * 新增歌曲
     */
    @PreAuthorize("@ss.hasPermi('system:music:add')")
    @Log(title = "歌曲", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysMusic sysMusic)
    {
        return toAjax(sysMusicService.insertSysMusic(sysMusic));
    }

    /**
     * 修改歌曲
     */
    @PreAuthorize("@ss.hasPermi('system:music:edit')")
    @Log(title = "歌曲", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysMusic sysMusic)
    {
        return toAjax(sysMusicService.updateSysMusic(sysMusic));
    }

    /**
     * 删除歌曲
     */
    @PreAuthorize("@ss.hasPermi('system:music:remove')")
    @Log(title = "歌曲", businessType = BusinessType.DELETE)
	@DeleteMapping("/{musicIds}")
    public AjaxResult remove(@PathVariable Long[] musicIds)
    {
        return toAjax(sysMusicService.deleteSysMusicByMusicIds(musicIds));
    }
}
