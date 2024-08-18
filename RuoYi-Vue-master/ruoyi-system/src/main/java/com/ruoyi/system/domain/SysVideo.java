package com.ruoyi.system.domain;

import java.util.List;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 影视对象 sys_video
 * 
 * @author ruoyi
 * @date 2024-08-18
 */
public class SysVideo extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private Long videoId;

    /** 标题 */
    @Excel(name = "标题")
    private String title;

    /** 描述 */
    @Excel(name = "描述")
    private String description;

    /** 封面地址 */
    @Excel(name = "封面地址")
    private String thumbnailUrl;

    /** 观看次数 */
    @Excel(name = "观看次数")
    private Long views;

    /** 地址 */
    @Excel(name = "地址")
    private String url;

    /** 状态 */
    @Excel(name = "状态")
    private String status;

    /** 影视目录 */
    @Excel(name = "影视目录")
    private Long categoryId;

    /** 影视目录信息 */
    private List<SysVideoCategory> sysVideoCategoryList;

    public void setVideoId(Long videoId) 
    {
        this.videoId = videoId;
    }

    public Long getVideoId() 
    {
        return videoId;
    }
    public void setTitle(String title) 
    {
        this.title = title;
    }

    public String getTitle() 
    {
        return title;
    }
    public void setDescription(String description) 
    {
        this.description = description;
    }

    public String getDescription() 
    {
        return description;
    }
    public void setThumbnailUrl(String thumbnailUrl) 
    {
        this.thumbnailUrl = thumbnailUrl;
    }

    public String getThumbnailUrl() 
    {
        return thumbnailUrl;
    }
    public void setViews(Long views) 
    {
        this.views = views;
    }

    public Long getViews() 
    {
        return views;
    }
    public void setUrl(String url) 
    {
        this.url = url;
    }

    public String getUrl() 
    {
        return url;
    }
    public void setStatus(String status) 
    {
        this.status = status;
    }

    public String getStatus() 
    {
        return status;
    }
    public void setCategoryId(Long categoryId) 
    {
        this.categoryId = categoryId;
    }

    public Long getCategoryId() 
    {
        return categoryId;
    }

    public List<SysVideoCategory> getSysVideoCategoryList()
    {
        return sysVideoCategoryList;
    }

    public void setSysVideoCategoryList(List<SysVideoCategory> sysVideoCategoryList)
    {
        this.sysVideoCategoryList = sysVideoCategoryList;
    }

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("videoId", getVideoId())
            .append("title", getTitle())
            .append("description", getDescription())
            .append("thumbnailUrl", getThumbnailUrl())
            .append("views", getViews())
            .append("url", getUrl())
            .append("status", getStatus())
            .append("categoryId", getCategoryId())
            .append("sysVideoCategoryList", getSysVideoCategoryList())
            .toString();
    }
}
