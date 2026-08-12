#### 5.1 基元类型直接映射到FCL中的类型
如编译器将int映射到 System.Int32
```
int a = 0;
System.Int32 a= 0; // 二者相同
```
- 需注意decimal => System.Decimal用于==128位==高精度计算，不常用
- int在64位32位上==始终映射到 System.Int32==，所以都是32位的