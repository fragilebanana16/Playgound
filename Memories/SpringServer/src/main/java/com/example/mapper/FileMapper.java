package com.example.mapper;

import com.example.domain.FileMetadata;

import java.util.List;

import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface FileMapper {
    
    // 使用 MySQL 的 UPSERT 语法：路径冲突时更新旧数据
	@Insert("""
	        <script>
	        INSERT INTO file_metadata 
	        (file_name, file_path, size, extension, is_directory, last_modified, sync_time)
	        VALUES 
	        <foreach collection="list" item="item" separator=",">
	            (#{item.fileName}, #{item.filePath}, #{item.size}, #{item.extension}, 
	             #{item.isDirectory}, #{item.lastModified}, #{item.syncTime})
	        </foreach>
	        ON DUPLICATE KEY UPDATE
	        file_name = VALUES(file_name),
	        size = VALUES(size),
	        last_modified = VALUES(last_modified),
	        sync_time = VALUES(sync_time)
	        </script>
	    """)
	int batchUpsert(List<FileMetadata> list);
    
	// 分页查询列表
    @Select("""
        SELECT * FROM file_metadata 
        ORDER BY is_directory DESC, last_modified DESC 
        LIMIT #{offset}, #{limit}
    """)
    List<FileMetadata> selectPage(@Param("offset") int offset, @Param("limit") int limit);

    // 查询总数（前端分页或滚动需要知道什么时候停止）
    @Select("SELECT COUNT(*) FROM file_metadata")
    long countAll();
}