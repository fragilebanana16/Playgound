package com.ruoyi.system.service.impl;

import java.util.List;
import java.util.stream.Collectors;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.ruoyi.system.mapper.SysArtistsMapper;
import com.ruoyi.system.mapper.SysMusicMapper;
import com.ruoyi.system.domain.SysArtists;
import com.ruoyi.system.domain.SysMusic;
import com.ruoyi.system.service.ISysMusicService;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;


/**
 * 歌曲Service业务层处理
 * 
 * @author ruoyi
 * @date 2024-09-16
 */
@Service
public class SysMusicServiceImpl implements ISysMusicService 
{
    @Autowired
    private SysMusicMapper sysMusicMapper;
    
    @Autowired
    private SysArtistsMapper sysArtistsMapper;
    
    private static final String SONGS_FOLDER = "songs";
    private static final String LYRICS_FOLDER = "lyrics";
    private static final String COVERS_FOLDER = "covers";
    private static final String BASE_FOLDER = "D:\\ruoyi\\music";
    /**
     * 查询歌曲列表(本地目录)
     * 
     * @param sysMusic 歌曲
     * @return 歌曲集合
     */
    public int resetDbByLocalMusic(){
        try {
	        Path songsFolder = Paths.get(BASE_FOLDER , SONGS_FOLDER);
	        
	        // get local music
	        List<SysMusic> sysMusicList =  Files.list(songsFolder).map(t -> {
				try {
					return getSingleMusic(t);
				} catch (IOException e) {
					e.printStackTrace();
					return null;
				}
			}).collect(Collectors.toList());
	        
	        // truncate DB
	       sysMusicMapper.deleteSysMusic();
	       
	        // insert new data    
	       int insertCount = 0;
	       for (int index = 0; index < sysMusicList.size(); index++) {
	    	   SysMusic temp = sysMusicList.get(index);
	    	   String tempName = temp.getArtistName();
	    	   if(!tempName.isBlank()) {
	    		   SysArtists artist = sysArtistsMapper.selectSysArtistsByName(tempName);
	    		   if(artist == null) {
	    			   SysArtists newArtist = new SysArtists();
	    			   newArtist.setName(tempName);
	    			   int artistId = sysArtistsMapper.insertSysArtists(newArtist);
	    			   temp.setArtistId((long)artistId);
	    		   } else {
	    			   temp.setArtistId(artist.getId());
	    		   }
	    	   }
	    	   
	    	   if(sysMusicMapper.insertSysMusic(temp) > 0 ) {
	    		   insertCount++;
	    	   }
	    	}
	       
	       return insertCount;
        } catch (IOException e) {
            throw new RuntimeException("Error reading music directory", e);
        }
    }

    /**
     * 查询歌曲
     * 
     * @param musicId 歌曲主键
     * @return 歌曲
     */
    @Override
    public SysMusic selectSysMusicByMusicId(Long musicId)
    {
        return sysMusicMapper.selectSysMusicByMusicId(musicId);
    }

    /**
     * 查询歌曲列表
     * 
     * @param sysMusic 歌曲
     * @return 歌曲
     */
    @Override
    public List<SysMusic> selectSysMusicList(SysMusic sysMusic)
    {
        return sysMusicMapper.selectSysMusicList(sysMusic);
    }

    /**
     * 新增歌曲
     * 
     * @param sysMusic 歌曲
     * @return 结果
     */
    @Override
    public int insertSysMusic(SysMusic sysMusic)
    {
        return sysMusicMapper.insertSysMusic(sysMusic);
    }

    /**
     * 修改歌曲
     * 
     * @param sysMusic 歌曲
     * @return 结果
     */
    @Override
    public int updateSysMusic(SysMusic sysMusic)
    {
        return sysMusicMapper.updateSysMusic(sysMusic);
    }

    /**
     * 批量删除歌曲
     * 
     * @param musicIds 需要删除的歌曲主键
     * @return 结果
     */
    @Override
    public int deleteSysMusicByMusicIds(Long[] musicIds)
    {
        return sysMusicMapper.deleteSysMusicByMusicIds(musicIds);
    }

    /**
     * 删除歌曲信息
     * 
     * @param musicId 歌曲主键
     * @return 结果
     */
    @Override
    public int deleteSysMusicByMusicId(Long musicId)
    {
        return sysMusicMapper.deleteSysMusicByMusicId(musicId);
    }
    
    /**
     * 本地单个歌曲信息
     * 
     * @param musicId 歌曲地址
     * @return 结果
     */
    private SysMusic getSingleMusic(Path songFilePath) throws IOException {      
    	String[] imageExtensions = {".png", ".jpg", ".jpeg"};
    	Path fileName = songFilePath.getFileName();
		String fileNameWithOutExt = fileName.toString().replaceFirst("[.][^.]+$", "");
		SysMusic singleMusic = new SysMusic();
		
		// get lyric
	    Path lrcPath = Paths.get(BASE_FOLDER, LYRICS_FOLDER,  fileNameWithOutExt + ".lrc");
		if (Files.exists(lrcPath)) {
			singleMusic.setLyrUrl(fileNameWithOutExt + ".lrc");
		} else {
			singleMusic.setLyrUrl("defaultLyrUrl");
		}
		
       // get cover
		for (String extension : imageExtensions) {
		    Path coverPath = Paths.get(BASE_FOLDER, COVERS_FOLDER,  fileNameWithOutExt + extension);
		    if (Files.exists(coverPath)) {
		    	singleMusic.setThumbnailUrl(fileNameWithOutExt + extension);
		    }
		}
		
		if(StringUtils.isBlank(singleMusic.getThumbnailUrl())) {
			singleMusic.setThumbnailUrl("defaultCoverUrl");
		}

		// get names
        String trimmed = fileNameWithOutExt.trim();
        String[] parts = trimmed.split("-");
        if(parts != null && parts.length > 1) {
        	String songName = parts[0].trim();
        	String artistName = parts[1].trim();
        	singleMusic.setTitle(songName);
        	singleMusic.setArtistName(artistName);
        } else {
        	singleMusic.setTitle(trimmed);
        	singleMusic.setArtistName("Unknown");
        }
       
        // get song URL
        singleMusic.setUrl(fileName.toString());
		
		return singleMusic;
    }
}
