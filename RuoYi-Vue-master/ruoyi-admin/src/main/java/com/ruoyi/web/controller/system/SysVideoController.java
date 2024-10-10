package com.ruoyi.web.controller.system;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import javax.servlet.http.HttpServletResponse;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.domain.SysVideo;
import com.ruoyi.common.utils.poi.ExcelUtil;
import com.ruoyi.system.service.ISysVideoService;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestBody;
import com.ruoyi.common.core.controller.BaseController;
import com.ruoyi.common.core.page.TableDataInfo;
/**
 * Video
 * 
 */
@RestController
@RequestMapping("/system/video")
public class SysVideoController  extends BaseController
{
    @Autowired
    private ISysVideoService  sysVideoService;

    /**
     * 查询歌曲列表(本地目录)
     */
    @GetMapping("/localMovies")
    public int reset() {
        return sysVideoService.resetDbByLocalMovies();
    }
    
    /**
     * 查询影视列表
     */
    @GetMapping("/listTrending")
    public TableDataInfo listTrending(SysVideo sysVideo)
    {
    	startPage();
        List<SysVideo> list = sysVideoService.selectTrendingSysVideoList(sysVideo);
        return getDataTable(list);
    }
    
    /**
     * 查询影视列表
     */
    @GetMapping("/list")
    public TableDataInfo list(SysVideo sysVideo)
    {
    	startPage();
        List<SysVideo> list = sysVideoService.selectSysVideoList(sysVideo);
        return getDataTable(list);
    }

    /**
     * 导出影视列表
     */
    @PostMapping("/export")
    public void export(HttpServletResponse response, SysVideo sysVideo)
    {
        List<SysVideo> list = sysVideoService.selectSysVideoList(sysVideo);
        ExcelUtil<SysVideo> util = new ExcelUtil<SysVideo>(SysVideo.class);
        util.exportExcel(response, list, "影视数据");
    }

    /**
     * 获取影视详细信息
     */
    @GetMapping(value = "/{videoId}")
    public AjaxResult getInfo(@PathVariable("videoId") Long videoId)
    {
        return success(sysVideoService.selectSysVideoByVideoId(videoId));
    }

    /**
     * 新增影视
     */
    @PostMapping
    public AjaxResult add(@RequestBody SysVideo sysVideo)
    {
        return toAjax(sysVideoService.insertSysVideo(sysVideo));
    }

    /**
     * 修改影视
     */
    @PutMapping
    public AjaxResult edit(@RequestBody SysVideo sysVideo)
    {
        return toAjax(sysVideoService.updateSysVideo(sysVideo));
    }

    /**
     * 删除影视
     */
	@DeleteMapping("/{videoIds}")
    public AjaxResult remove(@PathVariable Long[] videoIds)
    {
        return toAjax(sysVideoService.deleteSysVideoByVideoIds(videoIds));
    }
}
