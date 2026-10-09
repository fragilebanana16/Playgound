#### 5.1 基元类型直接映射到FCL中的类型
如编译器将int映射到 System.Int32
```
int a = 0;
System.Int32 a= 0; // 二者相同
```
- 需注意decimal => System.Decimal用于==128位==高精度计算，不常用
- int在64位32位上==始终映射到 System.Int32==，所以都是32位的

#### 5.2 引用和值类型

**未装箱的值类型**在内存布局里少了托管堆对象必备的**对象头**

1. **同步块索引 (SyncBlock Index)** ---**加锁**
2. **类型对象指针 (Type Object Pointer / Method Table Pointer)**

> 问：CLR 怎么分辨一个类型是值类型还是引用类型？
> 答：看它的基类是不是 System.ValueType

继承关系：
        System.Object
        ├── System.ValueType
        │   ├── System.Int32 (int)
        │   ├── System.Boolean (bool)
        │   ├── System.Double (double)
        │   ├── 自定义的 struct
        │   └── System.Enum
        │   
        └── 其他引用类型（class、interface、delegate、array、string 等）


> 问：分配位置？
> 答：引用类型的对象实例在堆上，它内部的值类型字段也跟着在堆上；值类型只有在作为局部变量或参数时才在栈上
```
class Person
{
    public int Age;   // 值类型字段
    public bool IsAlive;
}

Person p = new Person();
```
Age、IsAlive 是对象的一部分，所以也在堆上

> 问：为什么要设计值类型？
> 答：值类型可以直接在栈上分配，分配和释放只是移动栈指针，非常快，而且不产生 GC 压力，适合**小、短生命周期、复制语义**的数据，比如：基本类型

#### 22 CLR和AppDomain

> 问：AppDomain是什么？为什么需要 AppDomain
> 答：AppDomain（应用程序域） 是 CLR 内部的隔离单元；隔离靠进程。但进程太重，在同一个进程内，提供类似进程的隔离，但开销小得多，而且可以卸载，虽然程序集不允许卸载但是domain可以
> 
> 问：跨域交换数据
> 答：按引用封送Marshaling
