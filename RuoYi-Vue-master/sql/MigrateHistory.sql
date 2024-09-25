CREATE TABLE `sys_video_category` (
    `category_id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='影视目录';

CREATE TABLE `sys_video` (
  `video_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `title` varchar(30) NOT NULL COMMENT '标题',
  `description` varchar(500) COMMENT '描述',
  `thumbnailUrl` varchar(128) COMMENT '封面地址',
  `views` bigint(20) DEFAULT 0 COMMENT '观看次数',
  `url` varchar(128) NOT NULL COMMENT '地址',
  `status` varchar(128) COMMENT '状态',
  `categoryId` bigint(20) COMMENT '影视目录',
  FOREIGN KEY (`categoryId`) REFERENCES `sys_video_category`(category_id),
  PRIMARY KEY (`video_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='影视';

DROP TABLE IF EXISTS `sys_video_category`;

INSERT INTO `sys_video_category` (`category_name`) VALUES
('动作片'),
('科幻片'),
('动画片'),
('日常记录'),
('其他');

-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视', '3', '1', 'video', 'system/video/index', 1, 0, 'C', '0', '0', 'system:video:list', '#', 'admin', sysdate(), '', null, '影视菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'system:video:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'system:video:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'system:video:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'system:video:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'system:video:export',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('影视', '1061', '1', 'video', 'system/video/index', 1, 0, 'C', '0', '0', 'system:video:list', '#', 'admin', sysdate(), '', null, '影视菜单');

-- UPDATE sys_menu SET column1 = value1, column2 = value2, ...
-- [WHERE condition];

CREATE TABLE `sys_artist` (
    `category_artist_id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `category_artist_name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='歌手';

DROP TABLE IF EXISTS sys_music;

CREATE TABLE `sys_music` (
  `music_id` bigint(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `title` varchar(30) NOT NULL COMMENT '标题',
  `duration` varchar(30) COMMENT '时长',
  `description` varchar(500) COMMENT '描述',
  `thumbnailUrl` varchar(128) COMMENT '封面地址',
  `url` varchar(128) NOT NULL COMMENT '地址',
  `lyrUrl` varchar(128) COMMENT '歌词',
  `artistId` bigint(20) COMMENT '歌手',
  FOREIGN KEY (`artistId`) REFERENCES `sys_artist`(artist_id),
  PRIMARY KEY (`music_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='歌曲';

-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌曲', '3', '1', 'music', 'system/music/index', 1, 0, 'C', '0', '0', 'system:music:list', '#', 'admin', sysdate(), '', null, '歌曲菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌曲查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'system:music:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌曲新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'system:music:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌曲修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'system:music:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌曲删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'system:music:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌曲导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'system:music:export',       '#', 'admin', sysdate(), '', null, '');

alter table sys_music drop foreign key `sys_music_ibfk_1`; 
ALTER TABLE sys_music CHANGE artistId artistName VARCHAR(255) COMMENT '歌手';
alter table sys_music  add constraint `sys_music_ibfk_1` foreign key (artistName) REFERENCES sys_artist(id);

INSERT INTO `ry-vue`.`sys_artist` (`category_artist_id`,`category_artist_name`) VALUES (123, 'Micahal');

INSERT INTO `ry-vue`.`sys_music`
(`music_id`, `title`, `duration`, `description`, `thumbnailUrl`, `url`, `lyrUrl`, `artistId`)
VALUES
(1, 'Beautiful Melody', '180', 'A soothing instrumental piece', 'https://example.com/image.jpg', 'https://example.com/music.mp3', 'https://example.com/lyrics.txt', 123);

truncate sys_music;

ALTER TABLE sys_artist CHANGE category_artist_id artist_id VARCHAR(255) COMMENT '歌手ID';
ALTER TABLE sys_artist CHANGE category_artist_name artist_name  BIGINT(20) COMMENT '歌手名';

SET FOREIGN_KEY_CHECKS=0; DROP TABLE `sys_music`; SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE `sys_artist` (
    `artist_id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `artist_name` VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='歌手';

ALTER TABLE `ry-vue`.sys_music CHANGE title title VARCHAR(300);

-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌手', '3', '1', 'artists', 'system/artists/index', 1, 0, 'C', '0', '0', 'system:artists:list', '#', 'admin', sysdate(), '', null, '歌手菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌手查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'system:artists:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌手新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'system:artists:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌手修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'system:artists:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌手删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'system:artists:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('歌手导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'system:artists:export',       '#', 'admin', sysdate(), '', null, '');

--  add singer avatar url
ALTER TABLE `ry-vue`.sys_artist ADD artist_avatar VARCHAR(255);

-- add playlist
CREATE TABLE `sys_music_playlist` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT PRIMARY KEY COMMENT '专辑ID',
  `title` varchar(30) NOT NULL COMMENT '标题',
  `description` varchar(500) COMMENT '描述',
  `thumbnailUrl` varchar(128) COMMENT '封面地址'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='专辑';

drop table sys_music_playlist;
-- list to songs
CREATE TABLE `sys_music_playlist_music_mapping` (
    `music_playlist_id` bigint(20),
    `music_id` bigint(20),
    PRIMARY KEY (music_playlist_id, music_id),
    FOREIGN KEY (`music_playlist_id`) REFERENCES `sys_music_playlist`(id) ON DELETE CASCADE,
    FOREIGN KEY (`music_id`) REFERENCES `sys_music`(music_id) ON DELETE CASCADE
);

-- 菜单 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('专辑', '3', '1', 'playlist', 'system/playlist/index', 1, 0, 'C', '0', '0', 'system:playlist:list', '#', 'admin', sysdate(), '', null, '专辑菜单');

-- 按钮父菜单ID
SELECT @parentId := LAST_INSERT_ID();

-- 按钮 SQL
insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('专辑查询', @parentId, '1',  '#', '', 1, 0, 'F', '0', '0', 'system:playlist:query',        '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('专辑新增', @parentId, '2',  '#', '', 1, 0, 'F', '0', '0', 'system:playlist:add',          '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('专辑修改', @parentId, '3',  '#', '', 1, 0, 'F', '0', '0', 'system:playlist:edit',         '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('专辑删除', @parentId, '4',  '#', '', 1, 0, 'F', '0', '0', 'system:playlist:remove',       '#', 'admin', sysdate(), '', null, '');

insert into sys_menu (menu_name, parent_id, order_num, path, component, is_frame, is_cache, menu_type, visible, status, perms, icon, create_by, create_time, update_by, update_time, remark)
values('专辑导出', @parentId, '5',  '#', '', 1, 0, 'F', '0', '0', 'system:playlist:export',       '#', 'admin', sysdate(), '', null, '');

select id, title, description, thumbnailUrl, musicId, artistId from sys_music_playlist;
