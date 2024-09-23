package com.ruoyi.system.domain;

import java.util.Date;
import com.fasterxml.jackson.annotation.JsonFormat;
import org.apache.commons.lang3.builder.ToStringBuilder;
import org.apache.commons.lang3.builder.ToStringStyle;
import com.ruoyi.common.annotation.Excel;
import com.ruoyi.common.core.domain.BaseEntity;

/**
 * 歌手对象 sys_artists
 * 
 * @author ruoyi
 * @date 2024-09-17
 */
public class SysArtists extends BaseEntity
{
    private static final long serialVersionUID = 1L;

    /** 歌手ID */
    private Long artist_id;

    @Excel(name = "歌手名")
    private String artist_name;

    @Excel(name = "歌手封面")
    private String artist_avatar;

    public void setId(Long id) 
    {
        this.artist_id = id;
    }

    public Long getId() 
    {
        return artist_id;
    }
    public void setName(String name) 
    {
        this.artist_name = name;
    }

    public String getName() 
    {
        return artist_name;
    }
    
    public void setArtistAvatar(String artistAvatar) 
    {
        this.artist_avatar = artistAvatar;
    }
    public String getArtistAvatar() 
    {
        return artist_avatar;
    }
    
    @Override
    public String toString() {
        return new ToStringBuilder(this,ToStringStyle.MULTI_LINE_STYLE)
            .append("artist_id", getId())
            .append("artist_name", getName())
            .append("artist_avatar", getArtistAvatar())
            .toString();
    }
}