package com.ruoyi.system.domain;

import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 歌曲对象 sys_music
 * 
 * @author ruoyi
 * @date 2024-09-16
 */
public class SysMusic extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 用户ID */
    private Long musicId;

    /** 标题 */
    @Excel(name = "标题")
    private String title;

    /** 时长 */
    @Excel(name = "时长")
    private String duration;

    /** 描述 */
    @Excel(name = "描述")
    private String description;

    /** 封面地址 */
    @Excel(name = "封面地址")
    private String thumbnailUrl;

    /** 地址 */
    @Excel(name = "地址")
    private String url;

    /** 歌词 */
    @Excel(name = "歌词")
    private String lyrUrl;

    /** 歌手 */
    @Excel(name = "歌手")
    private Long artistId;
    
    /** 歌手名 */
    @Excel(name = " 歌手名")
    private String artistName;

    public void setMusicId(Long musicId) 
    {
        this.musicId = musicId;
    }

    public Long getMusicId() 
    {
        return musicId;
    }
    public void setTitle(String title) 
    {
        this.title = title;
    }

    public String getTitle() 
    {
        return title;
    }
    public void setDuration(String duration) 
    {
        this.duration = duration;
    }

    public String getDuration() 
    {
        return duration;
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
    public void setUrl(String url) 
    {
        this.url = url;
    }

    public String getUrl() 
    {
        return url;
    }
    public void setLyrUrl(String lyrUrl) 
    {
        this.lyrUrl = lyrUrl;
    }

    public String getLyrUrl() 
    {
        return lyrUrl;
    }
    public void setArtistId(Long artistId) 
    {
        this.artistId = artistId;
    }

    public Long getArtistId() 
    {
        return artistId;
    }
    
    public void setArtistName(String artistName) 
    {
        this.artistName = artistName;
    }
    public String getArtistName() 
    {
        return artistName;
    }
    
    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("musicId", getMusicId())
            .append("title", getTitle())
            .append("duration", getDuration())
            .append("description", getDescription())
            .append("thumbnailUrl", getThumbnailUrl())
            .append("url", getUrl())
            .append("lyrUrl", getLyrUrl())
            .append("artistId", getArtistId())
            .toString();
    }
}
