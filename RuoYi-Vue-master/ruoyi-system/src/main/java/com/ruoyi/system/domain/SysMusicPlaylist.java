package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 专辑对象 sys_music_playlist
 * 
 * @author ruoyi
 * @date 2024-09-25
 */
public class SysMusicPlaylist extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 专辑ID */
    private Long id;

    /** 标题 */
    @Excel(name = "标题")
    private String title;

    /** 描述 */
    @Excel(name = "描述")
    private String description;

    /** 封面地址 */
    @Excel(name = "封面地址")
    private String thumbnailUrl;

    public void setId(Long id) 
    {
        this.id = id;
    }

    public Long getId() 
    {
        return id;
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

    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("id", getId())
            .append("title", getTitle())
            .append("description", getDescription())
            .append("thumbnailUrl", getThumbnailUrl())
            .toString();
    }
}
