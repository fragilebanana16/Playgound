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