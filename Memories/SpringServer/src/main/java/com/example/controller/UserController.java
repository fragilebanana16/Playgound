package com.example.controller;

import com.example.domain.User;
import com.example.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/user")
public class UserController {

    @Autowired
    private UserService userService;

    // 查询所有用户
    @GetMapping("/list")
    public List<User> list() {
        return userService.listAll();
    }

    // 查询单个用户
    @GetMapping("/{id}")
    public User getById(@PathVariable Long id) {
        return userService.getById(id);
    }

    // 新增用户
    @PostMapping
    public String add(@RequestBody User user) {
        userService.add(user);
        return "ok";
    }

    // 修改用户
    @PutMapping
    public String update(@RequestBody User user) {
        userService.update(user);
        return "ok";
    }

    // 删除用户
    @DeleteMapping("/{id}")
    public String delete(@PathVariable Long id) {
        userService.delete(id);
        return "ok";
    }
}
