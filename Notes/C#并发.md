##### 2.7 使用ConfigureAwait(false)取消切换上下文，避免性能问题
在默认情况下，一个async方法在被await调用后恢复运行时，会在原来的上下文中运行。如果是UI上下文，并且有大量的async方法在UI上下文中恢复，就会引起性能上的问题。什么时候需要上下文传下去呢？

```c#
await Task.Delay(TimeSpan. FromSeconds(1)).ConfigureAwait(false);
```

# 数据并行TPL

Parallel.ForEach

*数据并行*指的是对源集合或数组的元素同时（即，并行）执行相同操作的场景，为 Parallel.For 或 Parallel.ForEach循环编写的循环逻辑与编写连续循环的相似。 无需创建线程或列工作项。 在基本循环中，不需要加锁。 TPL 为你处理所有低级别的工作。如对1-10000都加1的操作，正常for一个一个串行处理，如果是Parallel.For，则是并行处理，至于为什么能这样，不需要关心

- 并行时，是多个线程，谁先结束不确定；串行则是一个线程，可以在循环中输出Thread.CurrentThread.ManagedThreadId来查看

- 需要进行的操作独立，不能有多个并行需要访问同一个对象的情况发生，否则要lock，但这样并行就失去意义了

- Parallel可以将CPU利用率快速提升

  

限制使用线程数量
```c#
			var options = new ParallelOptions()
            {
                MaxDegreeOfParallelism = 2
            };
            int n = 10;
            Parallel.For(0, n, options, i =>
            {
                Console.WriteLine(@"value of i = {0}, thread = {1}",
                i, Thread.CurrentThread.ManagedThreadId);
                Thread.Sleep(10);
            });
```

停止循环Break(), Stop()

```c#
			var BreakSource = Enumerable.Range(0, 1000).ToList();
            int BreakData = 0;
            Parallel.For(0, BreakSource.Count, (i, BreakLoopState) =>
            {
                BreakData += i;
                if (BreakData > 100)
                {
                    BreakLoopState.Break();
                    Console.WriteLine("Break called iteration {0}. data = {1} ", i, BreakData);
                }
            });
            
            var StopSource = Enumerable.Range(0, 1000).ToList();
            int StopData = 0;
            Parallel.For(0, StopSource.Count, (i, StopLoopState) =>
            {
                StopData += i;
                if (StopData > 100)
                {
                    StopLoopState.Stop();
                }
            });
```



# C# 集合总结

## 非泛型

ArrayList、Stack、Queue、Hashtable、SortedList，他们存储的是Object存的类型可以不同，但是有拆装箱的消耗

## 泛型

类型安全，因为需要指定，但是线程不安全

| 容器                  | 是否有序 | 是否连续存储 | 获取方式 | 查效率O(n) | 操作效率O(n) | 其他 | 数据结构 |
| --------------------- | -------------------------------------------- | ---- | ------ | ------ | ------ | :----- | ------ |
| Dictionary<TKey, TValue> | 无序 | 连续 | Key | 1 | 1 | 查得快 | 哈希表 |
| SortedDictionary<TKey, TValue> | 有序 | 不连续 | Key | logn | logn | 比普通字典慢，用排序换的 | 红黑树 |
| SortedList<TKey, TValue> | 有序 | 连续 | Key | logn | n | 数组实现的树 | 数组 |
| List<T>                | 有序 | 连续 | Index | 1 | n |  | 数组 |
| LinkedList<T> | 有序 | 不连续 | 不支持 | n | 1 | 适用中间插删 | 链表 |
| HashSet<T>     | 无序 | 连续 | Key | 1 | 1 | 不允许重复，比列表快，支持交集、合并等，像是键值相同的普通字典 | 哈希表 |
| SortedSet<T>                       | 有序 | 不连续 | Key | logn | logn | 不允许重复，像是键值相同的有序字典 | 红黑树 |
| Stack<T>               | LIFO | 连续 | Top | 1 | 1 | 除了LIFO和list一样 | 数组 |
| Queue<T>     | FIFO | 连续 | Front | 1 | 1 | 除了FIFO和list一样 | 数组 |

## 线程安全的集合
多个线程操作一个容器
      1. ConcurrentDictionary< Key, Value>
      2. ConcurrentQueue<T>
      3. ConcurrentStack<T>
      4. ConcurrentBag<T> (无序集合，线程安全的List)
      5. BlockingCollection<T> (生产消费者模式使用？)

 阻塞分为计算阻塞和 io 阻塞，异步主要用来等待 io 处理，而计算阻塞主要通过并行运算提高效率。异步和并行都属于并发。==一般Task.Run用于计算密集==，asyc用于io（文件，数据库等，io异步并不能提升性能，因为取决于外部io响应速度，这里做的只是能够让调用方响应其他）

If you wrap IO-bound work in Task.Run() then you’re just pulling a new thread out to run the code synchronously. It may have a similar signature because it’s returning a Task, but all you’re doing is blocking a different thread.

如果既有io密集又有cpu密集呢？实现中不要Task.run调用可以Task.run

## Task.Delay和Thread.Sleep

Sleep会阻塞，Delay是异步，比如sleep后面还有要做的事情，就做不了了

==为什么不推荐在线程池中包装同步代码（阻塞）==？实际浪费一个线程，线程池任务会调度，可能一个线程要服务好几个Task，切来切去，结果你阻塞了，极限思考下如果线程池全部都Sleep了，调度效率会高吗，==Task.Run包装同步代码并真正异步？==这个sleep和你包装的非同步代码是一样的道理，实际上线程池里面的这个线程是阻塞的，==线程池是个全局的资源==，ui还好，如果是高并发服务器，可能有扩展性问题，吞吐量瓶颈，这也能解释为什么有的库Method还有另外一种实现MethodAsync(如果包装有效，直接Task.run包装Method就行了)

==async里千万不要阻塞==

==Task.Run里千万不要建线程== 线程池里建线程，套娃，==就要负责线程管理策略==

```c#
  // 不推荐，在ui看来UI没有阻塞，但是新的线程阻塞了
  public async Task RetrieveValueAsync(int id)
  {
    await Task.Run(() =>
    {
      // Make an assignment..
      // Access to the DB, web request, etc.
      Thread.Sleep(500);
      return 42;
    });
  }
  
  public async Task RetrieveValueAsync(int id)
  {
    // Converted to a non-blocking code.
    // Access to DBs, web request, etc.
    Task delay = Task.Delay(500); // 这里不阻塞，输出立马输出，如果Sleep了输出就是5s后了
    Console.WriteLine("async: Running for {0} seconds", sw.Elapsed.TotalSeconds);
    await delay;
    return 42;
  }
```

## wait和await

wait是同步阻塞，await是异步等（不能叫异步阻塞？）

[下图t.Wait()实际上阻塞了调用方](https://docs.microsoft.com/en-us/shows/three-essential-tips-for-async/)

![syncTips](H:\PR_pojects\yy余粮\images\syncTips.png)

为什么返回void最好写成Task？fire and forget ?如果执行的逻辑里有异常，那么不会造成调用方的崩溃，而是存储在返回的Task里，fire and forget意味着不处理，因为也没有wait



将async进行到每一步？

#### 并行两种手段

1. The Task Parallel Library (TPL)
2. Parallel LINQ (PLINQ)

#### 并行目的是为了

1. 纵向扩展性Vertical Scalability an improvement in the processing capability of our application
2. 响应response

Parallelism是多核，使用了多线程，但多线程不一定会用到Parallelism

#### Interlocked vs Lock

Interlock确实要比全局lockobj快

典中典：连续使用Interlock依然不能保证最终结果一致，因为两个分别是线程安全，但放一块就不是了，解决就是lockobj把两个包起来

```                    c#
			long IncrementValue= 0;
            long SumValue = 0;
            Parallel.For(0, 100000, number =>
            {
                Interlocked.Increment(ref IncrementValue);
                Interlocked.Add(ref SumValue, IncrementValue);
            });
            
            Console.WriteLine($"Increment Value With Interlocked: {IncrementValue}");
            Console.WriteLine($"Sum Value With Interlocked: {SumValue}");
            Console.ReadKey();
```

![threadSafeUnion](H:\PR_pojects\yy余粮\images\threadSafeUnion.png)

# 多线程

## 给数据到线程？

带参数传给线程用ParameterizedThreadStart，缺点是传的是obj，类型不安全，如果start传的是字符串就崩了

```c#
	static void Main(string[] args)
    {
        Program obj = new Program();

        ParameterizedThreadStart PTSD = new ParameterizedThreadStart(obj.DisplayNumbers);
        Thread t1 = new Thread(PTSD);
        t1.Start(5); 
        
        Console.Read();
    }

   public void DisplayNumbers(object Max)
   {
        int Number = Convert.ToInt32(Max);
        for (int i = 1; i <= Number; i++)
        {
            Console.WriteLine("Method1 :" + i); 
        }  
   }
```
为了类型安全，一种办法是添加帮助类，把参数给到类的构造，DisplayNumbers成为类的成员，这个参数传到成员变量里使用
```
NumberHelper obj = new NumberHelper(MaxArg);
Thread T1 = new Thread(new ThreadStart(obj.DisplayNumbers));
```

## 从线程拿数据？

一种是通过帮助类将委托和线程函数通过帮助类构造传进去，在线程结束前调用委托，外面有回调函数拿到结果
```c#
using System;
namespace ThreadingDemo
{
    // First Create the callback delegate with the same signature of the callback method.
    public delegate void ResultCallbackDelegate(int Results);
    //Creating the Helper class
    public class NumberHelper
    {
        //Creating two private variables to hold the Number and ResultCallback instance
        private int _Number;
        private ResultCallbackDelegate _resultCallbackDelegate;
        //Initializing the private variables through constructor
        //So while creating the instance you need to pass the value for Number and callback delegate
        public NumberHelper(int Number, ResultCallbackDelegate resultCallbackDelagate)
        {
            _Number = Number;
            _resultCallbackDelegate = resultCallbackDelagate;
        }
        //This is the Thread function which will calculate the sum of the numbers
        public void CalculateSum()
        {
            int Result = 0;
            for (int i = 1; i <= _Number; i++)
            {
                Result = Result + i;
            }
            //Before the end of the thread function call the callback method
            if (_resultCallbackDelegate != null)
            {
                _resultCallbackDelegate(Result);
            }
        }
    }
}

using System.Threading;
using System;
namespace ThreadingDemo
{
    class Program
    {
        static void Main(string[] args)
        {
            //Create the ResultCallbackDelegate instance and to its constructor 
            //pass the callback method name
            ResultCallbackDelegate resultCallbackDelegate = new ResultCallbackDelegate(ResultCallBackMethod);
            int Number = 10;
            //Creating the instance of NumberHelper class by passing the Number
            //the callback delegate instance
            NumberHelper obj = new NumberHelper(Number, resultCallbackDelegate);
            //Creating the Thread using ThreadStart delegate
            Thread T1 = new Thread(new ThreadStart(obj.CalculateSum));
            
            T1.Start();
            Console.Read();
        }
        //Callback method and the signature should be the same as the callback delegate signature
        public static void ResultCallBackMethod(int Result)
        {
            Console.WriteLine("The Result is " + Result);
        }
    }
}
```

其他：

**.NET 2.0+:**

A) You can create the `Thread` object directly. In this case you could use "closure" - declare variable and capture it using lambda-expression:

```cs
object result = null;
Thread thread = new System.Threading.Thread(() => { 
    //Some work...
    result = 42; });
thread.Start();
thread.Join();
Console.WriteLine(result);
```

B) You can use delegates and `IAsyncResult` and return value from `EndInvoke()` method:

```cs
delegate object MyFunc();
...
MyFunc x = new MyFunc(() => { 
    //Some work...
    return 42; });
IAsyncResult asyncResult = x.BeginInvoke(null, null);
object result = x.EndInvoke(asyncResult);
```

C) You can use `BackgroundWorker` class. In this case you could use captured variable (like with `Thread` object) or handle `RunWorkerCompleted` event:

```cs
BackgroundWorker worker = new BackgroundWorker();
worker.DoWork += (s, e) => {
    //Some work...
    e.Result = 42;
};
worker.RunWorkerCompleted += (s, e) => {
    //e.Result "returned" from thread
    Console.WriteLine(e.Result);
};
worker.RunWorkerAsync();
```

**.NET 4.0+:**

Starting with .NET 4.0 you could use [Task Parallel Library](https://msdn.microsoft.com/en-us/library/dd460717(v=vs.110).aspx) and `Task` class to start your threads. Generic class `Task` allows you to get return value from `Result` property:

```cs
//Main thread will be blocked until task thread finishes
//(because of obtaining the value of the Result property)
int result = Task.Factory.StartNew(() => {
    //Some work...
    return 42;}).Result;
```

**.NET 4.5+:**

Starting with .NET 4.5 you could also use `async`/`await` keywords to return value from task directly instead of obtaining `Result` property:

```cs
int result = await Task.Run(() => {
    //Some work...
    return 42; });
```

Note: method, which contains the code above shoud be marked with `async`keyword.

For many reasons using of Task Parallel Library is preferable way of working with threads.

## 同步机制

1. Lock ，无法控制外部线程？内部是指自己产生的线程
2. Monitor，Lock = Monitor + try-finally 比lock更多控制，无法控制外部线程？
3. Mutex，可控制外部，线程生成的exe当多次打开下面代码保证只有一个会显示Application Is Running
```
        static void Main(string[] args)
        {
            using(Mutex mutex = new Mutex(false, "MutexDemo"))
            {
                //Checking if Other External Thread is Running
                if(!mutex.WaitOne(5000, false))
                {
                    Console.WriteLine("An Instance of the Application is Already Running");
                    Console.ReadKey();
                    return;
                }
                Console.WriteLine("Application Is Running.......");
                Console.ReadKey();
            }
        }
```

4. Semaphore，前面三种都是只允许一个线程访问临界区，且Mutex控制外部线程，相比Mutex信号量可控制访问它的线程数量
5. SemaphoreSlim ，与4相似，不过控制的是内部线程

#### 线程池速度远比新建一个单独或两三个线程执行的速度快

#### 线程分为

- 前台线程：执行完分配的任务才结束，不关心main结束没结束
- 后台线程：main结束，后台也结束，线程池默认是后台

默认线程是前台，thread有设置IsBackground属性来设置前后台

#### AutoResetEvent and ManualResetEvent：线程同步，但是发信号

锁未免太麻烦，不论是轮询锁还是有其他优化算法，难道不能是一个线程完了发信号给其他线程，其他开始做吗？AutoResetEvent 就是这样一个类似信号的类

```c#
		// 默认设置AutoResetEvent信号是false，这种情况WaitOne的线程默认在等信号，外面set后输出Finishing
		static AutoResetEvent autoResetEvent = new AutoResetEvent(false);
        
        static void Main(string[] args)
        {
            Thread newThread = new Thread(SomeMethod)
            {
                Name = "NewThread"
            };
            newThread.Start(); //It will invoke the SomeMethod in a different thread
            //To See how the SomeMethod goes in halt mode
            //Once we enter any key it will call set method and the SomeMethod will Resume its work
            Console.ReadLine();
            //It will send a signal to other threads to resume their work
            autoResetEvent.Set();
        }
        static void SomeMethod()
        {
            Console.WriteLine("Starting........");
            //Put the current thread into waiting state until it receives the signal
            autoResetEvent.WaitOne(); //It will make the thread in halt mode
            Console.WriteLine("Finishing........");
      Console.ReadLine(); //To see the output in the console
        }
```

ManualResetEvent和AutoResetEvent类似，只不过Auto的需要WaitOne和Set数量对应，Manual一个Set其他线程都会收到信号

## 线程的状态

- Unstarted (New) State：实例化Thread后
- Runnable State (Ready to Run)：Start调用后，注意Start不是立马到Running状态，什么时候是由thread scheduler决定的，==所以有线程优先级的概念==
- Running：thread scheduler决定选择让该线程Run()
- Not Runnable State:遇到Wait()、Sleep()、另一个线程Join() 、等io
- Dead State：结束或者Abort()

```c#
        static void Main(string[] args)
        {
            // Creating and initializing threads Unstarted state
            Thread thread1 = new Thread(SomeMethod);
            Console.WriteLine($"ThreadState: {thread1.ThreadState}");
            // Running state
            thread1.Start();
            Console.WriteLine($"ThreadState: {thread1.ThreadState}");
            // thread1 is in suspended state
            thread1.Suspend();
            Console.WriteLine($"ThreadState: {thread1.ThreadState}");
            // thread1 is resume to running state
            thread1.Resume();
            Console.WriteLine($"ThreadState: {thread1.ThreadState}");
            // thread1 is in Abort state
            thread1.Abort();
            Console.WriteLine($"ThreadState: {thread1.ThreadState}");
            Console.ReadKey();
        }
        public static void SomeMethod()
        {
            for (int x = 0; x < 5; x++)
            {
                Console.WriteLine("SomeMethod.....");
            }
        }
```

## 调试

Debug => Windows => Threads

Freeze和Thaw分别代表不想debug该线程，冷冻与解冻

断点想进线程1的断点怎么办？条件断点 System.Threading.Thread.CurrentThread.Name == “Thread One”