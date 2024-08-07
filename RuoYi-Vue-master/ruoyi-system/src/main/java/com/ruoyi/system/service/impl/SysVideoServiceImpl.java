package com.ruoyi.system.service.impl;

import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import com.ruoyi.common.core.domain.entity.SysVideo;
import com.ruoyi.system.service.ISysVideoService;

/**
 * 用户 业务层处理
 * 
 */
@Service
public class SysVideoServiceImpl implements ISysVideoService
{

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
}
