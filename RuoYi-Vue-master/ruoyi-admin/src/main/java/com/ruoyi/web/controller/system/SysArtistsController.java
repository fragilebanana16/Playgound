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
import com.ruoyi.system.domain.SysArtists;
import com.ruoyi.system.service.ISysArtistsService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 歌手Controller
 * 
 * @author ruoyi
 * @date 2024-09-23
 */
@RestController
@RequestMapping("/system/artists")
public class SysArtistsController extends BaseController
{
    @Autowired
    private ISysArtistsService sysArtistsService;

    /**
     * 查询歌手列表
     */
    @PreAuthorize("@ss.hasPermi('system:artists:list')")
    @GetMapping("/list")
    public TableDataInfo list(SysArtists sysArtists)
    {
        startPage();
        List<SysArtists> list = sysArtistsService.selectSysArtistsList(sysArtists);
        return getDataTable(list);
    }

    /**
     * 导出歌手列表
     */
    @PreAuthorize("@ss.hasPermi('system:artists:export')")
    @Log(title = "歌手", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysArtists sysArtists)
    {
        List<SysArtists> list = sysArtistsService.selectSysArtistsList(sysArtists);
        ExcelUtil<SysArtists> util = new ExcelUtil<SysArtists>(SysArtists.class);
        util.exportExcel(response, list, "歌手数据");
    }

    /**
     * 获取歌手详细信息
     */
    @PreAuthorize("@ss.hasPermi('system:artists:query')")
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysArtistsService.selectSysArtistsById(id));
    }

    /**
     * 新增歌手
     */
    @PreAuthorize("@ss.hasPermi('system:artists:add')")
    @Log(title = "歌手", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysArtists sysArtists)
    {
        return toAjax(sysArtistsService.insertSysArtists(sysArtists));
    }

    /**
     * 修改歌手
     */
    @PreAuthorize("@ss.hasPermi('system:artists:edit')")
    @Log(title = "歌手", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysArtists sysArtists)
    {
        return toAjax(sysArtistsService.updateSysArtists(sysArtists));
    }

    /**
     * 删除歌手
     */
    @PreAuthorize("@ss.hasPermi('system:artists:remove')")
    @Log(title = "歌手", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysArtistsService.deleteSysArtistsByIds(ids));
    }
}
