package com.ruoyi.system.service.impl;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import com.ruoyi.common.core.domain.entity.SysVideo;
import com.ruoyi.system.service.ISysVideoService;
import static com.ruoyi.common.constant.VideoConstants.*;
import java.io.FileNotFoundException;
import java.io.RandomAccessFile;
import org.springframework.http.HttpHeaders;
import org.springframework.util.StringUtils;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
/**
 * 用户 业务层处理
 * 
 */
@Service
public class SysVideoServiceImpl implements ISysVideoService
{
	private final Logger logger = LoggerFactory.getLogger(SysVideoServiceImpl.class);
    /**
     */
    @Override
    public List<SysVideo> getVideos()
    {
    	ArrayList<SysVideo> videos = new ArrayList<SysVideo>(); 
    	SysVideo sysVideo = new SysVideo();
    	sysVideo.setTitle("Someone’s bound to get burned");
    	sysVideo.setDescription("BBC news");
    	sysVideo.setViews((long) 900.0);
    	videos.add(sysVideo);
    	
    	SysVideo sysVideo2 = new SysVideo();
    	sysVideo2.setTitle("When every part of me wants every inch of you there is more than that");
    	sysVideo2.setDescription("this is a very long name author and how to make it short imean its really long god dam it");
    	sysVideo2.setViews((long) 234400.0);
    	videos.add(sysVideo2);
    
        return videos;
    }
    
    
    @Override
    public ResponseEntity<StreamingResponseBody> loadPartialMediaFile
                         (String localMediaFilePath, String rangeValues)
          throws IOException
    {
       if (!StringUtils.hasText(rangeValues))
       {
          System.out.println("Read all media file content.");
          return loadEntireMediaFile(localMediaFilePath);
       }
       else
       {
          long rangeStart = 0L;
          long rangeEnd = 0L;
          
          if (!StringUtils.hasText(localMediaFilePath))
          {
             throw new IllegalArgumentException
                   ("The full path to the media file is NULL or empty.");
          }
             
          Path filePath = Paths.get(localMediaFilePath);      
          if (!filePath.toFile().exists())
          {
             throw new FileNotFoundException("The media file does not exist.");
          }

          long fileSize = Files.size(filePath);

          System.out.println("Read rang seeking value.");
          System.out.println("Rang values: [" + rangeValues + "]");
          
          int dashPos = rangeValues.indexOf("-");
          if (dashPos > 0 && dashPos <= (rangeValues.length() - 1))
          {
             String[] rangesArr = rangeValues.split("-");
             
             if (rangesArr != null && rangesArr.length > 0)
             {
                System.out.println("ArraySize: " + rangesArr.length);
                if (StringUtils.hasText(rangesArr[0]))
                {
                   System.out.println("Rang values[0]: [" + rangesArr[0] + "]");
                   String valToParse = numericStringValue(rangesArr[0]);
                   rangeStart = safeParseStringValuetoLong(valToParse, 0L);
                }
                else
                {
                   rangeStart = 0L;
                }
                
                if (rangesArr.length > 1)
                {
                   System.out.println("Rang values[1]: [" + rangesArr[1] + "]");
                   String valToParse = numericStringValue(rangesArr[1]);
                   rangeEnd = safeParseStringValuetoLong(valToParse, 0L);
                }
                else
                {
                   if (fileSize > 0)
                   {
                      rangeEnd = fileSize - 1L;
                   }
                   else
                   {
                      rangeEnd = 0L;
                   }
                }
             }
          }

          if (rangeEnd == 0L && fileSize > 0L)
          {
             rangeEnd = fileSize - 1;
          }
          if (fileSize < rangeEnd)
          {
             rangeEnd = fileSize - 1;
          }
          
          System.out.println(String.format("Parsed Range Values: [%d] - [%d]", 
                             rangeStart, rangeEnd));
          
          return loadPartialMediaFile(localMediaFilePath, rangeStart, rangeEnd);
       }
    }
    
    private String numericStringValue(String origVal)
    {
       String retVal = "";
       if (StringUtils.hasText(origVal))
       {
          retVal = origVal.replaceAll("[^0-9]", "");
          System.out.println("Parsed Long Int Value: [" + retVal + "]");
       }
       
       return retVal;
    }
    
    private long safeParseStringValuetoLong(String valToParse, long defaultVal)
    {
       long retVal = defaultVal;
       if (StringUtils.hasText(valToParse))
       {
          try
          {
             retVal = Long.parseLong(valToParse);
          }
          catch (NumberFormatException ex)
          {
             // TODO: log the invalid long int val in text format.
             retVal = defaultVal;
          }
       }
       
       return retVal;
    }
    
    @Override
    public ResponseEntity<StreamingResponseBody> 
           loadEntireMediaFile(String localMediaFilePath)
          throws IOException
    {
       Path filePath = Paths.get(localMediaFilePath);      
       if (!filePath.toFile().exists())
       {
          throw new FileNotFoundException("The media file does not exist.");
       }

       long fileSize = Files.size(filePath);
       long endPos = fileSize;
       if (fileSize > 0L)
       {
          endPos = fileSize - 1;
       }
       else
       {
          endPos = 0L;
       }
       
       ResponseEntity<StreamingResponseBody> retVal = 
                          loadPartialMediaFile(localMediaFilePath, 0, endPos);
       
       return retVal;
    }
          
          @Override
          public ResponseEntity<StreamingResponseBody> 
            loadPartialMediaFile(String localMediaFilePath, long fileStartPos, long fileEndPos)
                throws IOException
          {
             StreamingResponseBody responseStream;
             Path filePath = Paths.get(localMediaFilePath); 
             if (!filePath.toFile().exists())
             {
                throw new FileNotFoundException("The media file does not exist.");
             }
             
             long fileSize = Files.size(filePath);
             if (fileStartPos < 0L)
             {
                fileStartPos = 0L;
             }
             
             if (fileSize > 0L)
             {
                if (fileStartPos >= fileSize)
                {
                   fileStartPos = fileSize - 1L;
                }
                
                if (fileEndPos >= fileSize)
                {
                   fileEndPos = fileSize - 1L;
                }
             }
             else
             {
                fileStartPos = 0L;
                fileEndPos = 0L;
             }
             
             byte[] buffer = new byte[4096];
             String mimeType = Files.probeContentType(filePath);

             final HttpHeaders responseHeaders = new HttpHeaders();
             String contentLength = String.valueOf((fileEndPos - fileStartPos) + 1);
             responseHeaders.add("Content-Type", mimeType);
             responseHeaders.add("Content-Length", contentLength);
             responseHeaders.add("Accept-Ranges", "bytes");
             responseHeaders.add("Content-Range", 
                     String.format("bytes %d-%d/%d", fileStartPos, fileEndPos, fileSize));

             final long fileStartPos2 = fileStartPos;
             final long fileEndPos2 = fileEndPos;
             responseStream = os -> {
                try (RandomAccessFile file = new RandomAccessFile(localMediaFilePath, "r")) {
			
					   long pos = fileStartPos2;
					   file.seek(pos);
					   while (pos < fileEndPos2)
					   {
					      file.read(buffer);
					      os.write(buffer);
					      pos += buffer.length;
					   }
					   os.flush();
				}
             };
                
             return new ResponseEntity<StreamingResponseBody>
                    (responseStream, responseHeaders, HttpStatus.PARTIAL_CONTENT);
          }
 
}
