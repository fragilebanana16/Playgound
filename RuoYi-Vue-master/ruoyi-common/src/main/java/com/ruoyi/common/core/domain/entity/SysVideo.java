package com.ruoyi.common.core.domain.entity;

import java.util.ArrayList;
import java.util.List;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * sys_video
 * 
 */
public class SysVideo extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    private String title;

    private String description;

    private String  thumbnailUrl;

    private Long views;

    private String url;

    private String status;
    
    // foreign key
    private String categoryId;
    
     // foreign key
    private String userId;

    private List<SysVideo> videos = new ArrayList<SysVideo>();

    // title
    public String getTitle()
    {
        return title;
    }

    public void setTitle(String title)
    {
        this.title = title;
    }
    
    // Description
    public String getDescription()
    {
        return description;
    }

    public void setDescription(String description)
    {
        this.description = description;
    }
    
    // thumbnailUrl    
    public String getThumbnailUrl()
    {
        return thumbnailUrl;
    }

    public void setThumbnailUrl(String thumbnailUrl)
    {
        this.thumbnailUrl = thumbnailUrl;
    }
    
    // views
    public Long getViews()
    {
        return views;
    }

    public void setViews(Long views)
    {
        this.views = views;
    }
    
    // url
    public String getUrl()
    {
        return url;
    }

    public void setUrl(String url)
    {
        this.url = url;
    }
    
    // status
    public String getStatus()
    {
        return status;
    }

    public void setStatus(String status)
    {
        this.status = status;
    }
    
     // categoryId
    public String getCategoryId()
    {
        return categoryId;
    }

    public void setCategoryId(String categoryId)
    {
        this.categoryId = categoryId;
    }    
    
    // userId
    public String getUserId()
    {
        return status;
    }

    public void setUserId(String userId)
    {
        this.userId = userId;
    }   
    
     // videos
    public List<SysVideo> getVideos()
    {
        return videos;
    }


    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("title", getTitle())
            .append("description", getDescription())
            .append("thumbnailUrl", getThumbnailUrl())
            .append("views", getViews())
            .append("url", getUrl())
            .append("status", getStatus())
            .append("categoryId", getCategoryId())
            .append("userId", getUserId())
            .toString();
    }
}
