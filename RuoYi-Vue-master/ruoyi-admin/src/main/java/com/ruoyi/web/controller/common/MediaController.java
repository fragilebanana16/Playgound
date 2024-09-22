package com.ruoyi.web.controller.common;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.ruoyi.common.core.domain.AjaxResult;
import com.ruoyi.system.domain.SysVideo;
import com.ruoyi.system.service.ISysVideoService;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.file.Files;
import java.io.BufferedInputStream;  
import java.io.BufferedOutputStream;  
import java.io.InputStream;
import java.io.OutputStream;

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
    
    @GetMapping("getTest/{fileName}")
    public AjaxResult getTest(@PathVariable("fileName") String fileName)
    {
        return AjaxResult.success("This is rsp:" +  fileName);
    }
    
    
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


    @GetMapping("/fileContent")
    public void fileDownload(HttpServletResponse response, @RequestParam("fileType") String fileType, @RequestParam("fileName") String fileName) throws IOException {
    	if(!fileType.equals( "lyrics")) {
    		throw new IOException("不支持读取其他文件目录");
    	}
    	
    	String filePath = "D:\\ruoyi\\music\\" + fileType + "\\" + fileName;
        File file = new File(filePath);
        if (!file.exists()) {
            throw new IOException("当前下载的文件不存在，请检查路径是否正确");
        }

        // 清空 response
        response.reset();
        response.setCharacterEncoding("UTF-8");

        response.addHeader("Content-Disposition", "attachment;filename=" + URLEncoder.encode(file.getName(), "UTF-8"));
        response.setContentType("application/octet-stream");

        // 将文件读到输入流中
        try (InputStream is = new BufferedInputStream(Files.newInputStream(file.toPath()))) {
            
            OutputStream outputStream = new BufferedOutputStream(response.getOutputStream());
            
            byte[] buffer = new byte[1024];
            int len;

            //从输入流中读取一定数量的字节，并将其存储在缓冲区字节数组中，读到末尾返回-1
            while((len = is.read(buffer)) > 0){
                outputStream.write(buffer, 0, len);
            }

            outputStream.close();

        } catch (IOException e) {
            throw new RuntimeException(e);
        }

    }
}
