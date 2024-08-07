package com.ruoyi.web.controller.system;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysVideo;
import com.ruoyi.system.service.ISysVideoService;

/**
 * Video
 * 
 */
@RestController
@RequestMapping("/system/video")
public class SysVideoController
{
    @Autowired
    private ISysVideoService  videoService;

    /**
     * 获取路由信息
     * 
     * @return 路由信息
     */
    @GetMapping("getVideos")
    public AjaxResult getVideos()
    {
        List<SysVideo> menus = videoService.getVideos();
        return AjaxResult.success(menus);
    }
}
