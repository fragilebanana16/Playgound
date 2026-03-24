package com.example.mapper;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import com.example.domain.PhotoInfo;

import java.util.List;

@Mapper
public interface PhotoMapper {

    @Insert("""
        INSERT INTO photo (filename, file_path, thumbnail_url, original_url,
            lat, lng, altitude, shoot_time, location, width, height)
        VALUES (#{filename}, #{filePath}, #{thumbnailUrl}, #{originalUrl},
            #{lat}, #{lng}, #{altitude}, #{shootTime}, #{location}, #{width}, #{height})
        """)
    void insert(PhotoInfo info);

    @Select("SELECT COUNT(1) > 0 FROM photo WHERE filename = #{filename}")
    boolean existsByFilename(String filename);

    @Select("""
        SELECT * FROM photo
        WHERE lng BETWEEN #{west} AND #{east}
        AND lat BETWEEN #{south} AND #{north}
        LIMIT #{limit}
        """)
    List<PhotoInfo> findByBbox(@Param("west") Double west, @Param("east") Double east,
                               @Param("south") Double south, @Param("north") Double north,
                               @Param("limit") int limit);
}