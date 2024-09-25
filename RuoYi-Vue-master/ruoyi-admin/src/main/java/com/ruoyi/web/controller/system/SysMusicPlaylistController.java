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
import com.ruoyi.system.domain.SysMusicPlaylist;
import com.ruoyi.system.service.ISysMusicPlaylistService;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.common.core.page.TableDataInfo;

/**
 * 专辑Controller
 * 
 * @author ruoyi
 * @date 2024-09-25
 */
@RestController
@RequestMapping("/system/musicPlaylist")
public class SysMusicPlaylistController extends BaseController
{
    @Autowired
    private ISysMusicPlaylistService sysMusicPlaylistService;

    /**
     * 查询专辑列表
     */
    @GetMapping("/list")
    public TableDataInfo list(SysMusicPlaylist sysMusicPlaylist)
    {
        startPage();
        List<SysMusicPlaylist> list = sysMusicPlaylistService.selectSysMusicPlaylistList(sysMusicPlaylist);
        return getDataTable(list);
    }

    /**
     * 导出专辑列表
     */
    @Log(title = "专辑", businessType = BusinessType.EXPORT)
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysMusicPlaylist sysMusicPlaylist)
    {
        List<SysMusicPlaylist> list = sysMusicPlaylistService.selectSysMusicPlaylistList(sysMusicPlaylist);
        ExcelUtil<SysMusicPlaylist> util = new ExcelUtil<SysMusicPlaylist>(SysMusicPlaylist.class);
        util.exportExcel(response, list, "专辑数据");
    }

    /**
     * 获取专辑详细信息
     */
    @GetMapping(value = "/{id}")
    public AjaxResult getInfo(@PathVariable("id") Long id)
    {
        return success(sysMusicPlaylistService.selectSysMusicPlaylistById(id));
    }

    /**
     * 新增专辑
     */
    @Log(title = "专辑", businessType = BusinessType.INSERT)
    @PostMapping
    public AjaxResult add(@RequestBody SysMusicPlaylist sysMusicPlaylist)
    {
        return toAjax(sysMusicPlaylistService.insertSysMusicPlaylist(sysMusicPlaylist));
    }

    /**
     * 修改专辑
     */
    @Log(title = "专辑", businessType = BusinessType.UPDATE)
    @PutMapping
    public AjaxResult edit(@RequestBody SysMusicPlaylist sysMusicPlaylist)
    {
        return toAjax(sysMusicPlaylistService.updateSysMusicPlaylist(sysMusicPlaylist));
    }

    /**
     * 删除专辑
     */
    @Log(title = "专辑", businessType = BusinessType.DELETE)
	@DeleteMapping("/{ids}")
    public AjaxResult remove(@PathVariable Long[] ids)
    {
        return toAjax(sysMusicPlaylistService.deleteSysMusicPlaylistByIds(ids));
    }
}
