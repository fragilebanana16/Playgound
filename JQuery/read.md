#### 应尽量传递window参数到内部闭包环境以优化查找链
变量先找局部再往外找，应尽量找局部
外层 IIFE 是一次性的初始化器，真正频繁用到 window 的是内部的函数

#### 闭包内挂载，避免内部data污染全局
```js
(function(global, factory) {
    global.jQuery = global.$ = factory(global);
}(typeof window !== "undefined" ? window : this, function(window) {
    var _data = {};
    var _queueHooks = {};
    // 定义 jQuery 主函数
    var jQuery = function(selector, context) { ... };
    return jQuery;
}));

```
否则要是写成这样
```js
var _data = {};
var _queueHooks = {};
function jQuery(selector, context) { ... }
window.jQuery = jQuery;
```

> Three.js  在早期版本里会把所有类和工具函数都挂载到一个全局对象 THREE 上

#### 页面加载事件顺序

页面加载事件顺序

| 事件             | 触发时机                                                 | 代表意义                                 | 示例操作                                      |
| ---------------- | -------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| DOMContentLoaded | DOM 树构建完成，但图片、样式表等外部资源可能尚未加载完成 | 可以安全地访问和操作 DOM 元素            | 添加事件监听器、操作 DOM 元素、初始化 UI 组件 |
| load             | 页面及所有依赖资源（图片、脚本、样式表等）全部加载完成   | 可以操作所有资源，包括图片尺寸等         | 获取图片实际尺寸、执行依赖外部资源的脚本      |
| beforeunload     | 页面即将卸载（如关闭窗口或跳转）                         | 提示用户是否离开页面，或保存未提交的数据 | 提示用户“确认离开”，或保存表单数据            |
| unload           | 页面已经卸载                                             | 清理资源、发送统计数据                   | 发送页面停留时间统计、清除定时器              |



readyState 状态

| 状态值      | 含义                                                       | 对应事件触发时机                     |
| ----------- | ---------------------------------------------------------- | ------------------------------------ |
| loading     | 文档正在加载中                                             | 尚未触发任何加载事件                 |
| interactive | 文档已解析完成，但子资源（如图片、样式表）可能尚未加载完成 | 对应 `DOMContentLoaded` 事件触发时机 |
| complete    | 文档和所有子资源已加载完成                                 | 对应 `load` 事件触发时机             |

#### 没必要看

jQuery  IE6-8 等老浏览器做了大量兼容性处理，比如统一事件绑定、DOM 操作、AJAX 等。