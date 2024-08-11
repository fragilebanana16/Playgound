package com.ruoyi.web.controller.system;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.common.core.domain.entity.SysVideo;
import com.ruoyi.system.service.ISysVideoService;

import reactor.core.publisher.Mono;

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
    
    @GetMapping("/stream/{fileType}/{fileName}")
    public Mono<ResponseEntity<byte[]>> streamVideo(ServerHttpResponse serverHttpResponse, @RequestHeader(value = "Range", required = false) String httpRangeList,
                                                    @PathVariable("fileType") String fileType,
                                                    @PathVariable("fileName") String fileName) {
        return Mono.just(videoService.prepareContent(fileName, fileType, httpRangeList));
    }
}
