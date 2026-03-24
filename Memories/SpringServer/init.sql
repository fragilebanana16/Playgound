-- 1. 建数据库
CREATE DATABASE IF NOT EXISTS mydb CHARACTER SET utf8mb4;
USE mydb;

-- 2. 建表
CREATE TABLE IF NOT EXISTS user (
    id          BIGINT PRIMARY KEY AUTO_INCREMENT,
    username    VARCHAR(50)  NOT NULL,
    password    VARCHAR(100) NOT NULL,
    email       VARCHAR(100),
    create_time DATETIME DEFAULT NOW()
);

-- 3. 插入测试数据
INSERT INTO user (username, password, email) VALUES
('张三', '123456', 'zhangsan@example.com'),
('李四', '123456', 'lisi@example.com');
