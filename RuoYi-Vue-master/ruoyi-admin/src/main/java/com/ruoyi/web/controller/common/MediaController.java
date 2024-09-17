package com.ruoyi.web.controller.common;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import javax.servlet.http.HttpServletRequest;
import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.domain.SysVideo;
import com.ruoyi.system.service.ISysVideoService;
import java.io.FileNotFoundException;
import java.io.IOException;
/**
 * Media
 * 
 */
@RestController
@RequestMapping("/media")
public class MediaController
{
    @Autowired
    private ISysVideoService  sysVideoService;

    /**
     * 获取路由信息
     * 
     * @return 路由信息
     */
    @GetMapping("getVideos")
    public AjaxResult getVideos()
    {
        List<SysVideo> menus = sysVideoService.getVideos();
        return AjaxResult.success(menus);
    }
    
//    @GetMapping("getTest/{fileName}")
//    public AjaxResult getTest(@PathVariable("fileName") String fileName)
//    {
//        return AjaxResult.success("This is rsp:" +  fileName);
//    }
    
    
    @GetMapping(value = "/streaming/{mediaType}/{url}")
    @ResponseBody
    public ResponseEntity<StreamingResponseBody> playMediaV02(
       @PathVariable("url")
       String url,
       @PathVariable("mediaType")
       String mediaType,
       @RequestHeader(value = "Range", required = false)
       String rangeHeader,
       HttpServletRequest req)
    {        
       try
       {         
    	  String midFix = mediaType;
    	  if(midFix.equals("music")) {
    		  midFix += "\\songs";
    	  }
    	  
          String filePathString = "D:\\ruoyi\\" + midFix + "\\" + url;
          ResponseEntity<StreamingResponseBody> retVal = sysVideoService.loadPartialMediaFile(filePathString, rangeHeader);
          return retVal;
       }
       catch (FileNotFoundException e)
       {
          return new ResponseEntity<>(HttpStatus.NOT_FOUND);
       }
       catch (IOException e)
       {
          return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
       }
    }
}
