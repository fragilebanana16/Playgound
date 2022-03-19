// [Title]
// <<Threading in .NET and WinForms>> 
// [Blog]
// https://www.codeproject.com/Articles/18702/Threading-in-NET-and-WinForms
// [Brief]
//                                                               ***C# 线程***
//   [1]Thread类接收一个ThreadStart委托类型，其签名无参无返回值，调用 MainThread_Parallel()将新建线程执行 MyFunction_Parallel()，输出在for循环次数够大时进行交替打印，经测试二者都是100时按顺序打印，
//      无法观察出是否交替，这种方式MyFunction_Parallel()无参无返回值，如何带参？=>[2](delegate的BeginInvoke)
//   [2]委托有一inbuilt函数BeginInvoke()，使用CLR提供的线程池执行任务，可带参在线程中调用函数，相比[1]，这种可以从主线程带参到子线程去，但无返回值?=>[3](delegate的EndInvoke)
//   [3][4]阻塞等待子线程返回值
//                                                               ***Winform 线程***
//   [5]子线程不能直接增加控件，何解?=>[6]
//   [6][7]可以把添加动作放到主线程的消息队列中，有两个队列
//      Post Message Queue(PostMessage()仅添加消息) 和 Send Message Queue(SendMessage()阻塞执行)
//      Controls.Invoke() 相当于SendMessage() 
//      Controls.BeginInvoke() 相当于PostMessage() 
//      Controls.EndInvoke
//      用于在子线程去更新主线程控件的一些状态任务
//   [8]实时更新控件
// The BeginInvoke available in the delegate and the BeginInvoke available in the Control class are not the same.
// The BeginInvoke on the delegates uses the thread pool threads to execute the function in parallel.
// But the BeginInvoke in the Control class just posts a message in the message queue.
// It will not create a separate thread to run the function.
// So, the delegate BeginInvoke may enable parallelism, but the Control BeginInvoke may not.
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace AddControlInThread
{
    public partial class Form1 : Form
    {
        private readonly SynchronizationContext _context; //[8]

        public Form1()
        {
            InitializeComponent();
            _context = SynchronizationContext.Current; //[8]
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            
            //this.MainThread_Parallel(); // [1]
            //this.MainThread_ParallelWithArgs(); // [2]
            //this.MainThread_WaitByEndInvoke(); // [3]
            //this.MainThread_NoWait(); // [4]
            //this.MainThread_AddControlInThread(); // [5] 线程间操作无效: 从不是创建控件“Form1”的线程访问它
            //this.MainThread_AddControlByEnQueue(); // [6]
            //this.MainThread_AddControlByEnQueueNoWait(); // [7]
            this.MainThread_UpdatingLabel(); // [8]
        }

        // [1]并行无规律交错输出
        private void MainThread_Parallel()
        {
            Thread t = new Thread(new ThreadStart(MyFunction_Parallel));
            t.Start();
            for (int i = 0; i < 300; i++)
                Console.WriteLine("I am in Main Thread {0}", i);
        }

        private void MyFunction_Parallel()
        {
            for (int i = 0; i < 100; i++)
                Console.WriteLine("I am in Different Thread {0}", i);
        }

        // [2]使用委托BeginInvoke带参传递子线程
        private delegate void MyDelegate(int i, string str);
        private void MainThread_ParallelWithArgs()
        {
            MyDelegate delInstance = new MyDelegate(MyFunction_ParallelWithArgs);
            delInstance.BeginInvoke(300, " I am in Delegate Thread", null, null);
            for (int i = 0; i < 10; i++)
                Console.WriteLine("I am in Main Thread {0}", i);
        }
        public void MyFunction_ParallelWithArgs(int count, string str)
        {
            for (int i = 0; i < count; i++)
                Console.WriteLine(str + " {0}", i);
        }

        // [3]EndInvoke会阻塞当前线程等待直到拿到返回值，同时保证了子线程的100行打印完后主线程再进行(否则会主线程结束但是子线程未完成，子线程也跟着被销毁[4])
        private delegate bool MyDelegateWithRet(int i, string str);
        private void MainThread_WaitByEndInvoke()
        {
            MyDelegateWithRet delInstance = new MyDelegateWithRet(MyFunction_WaitByEndInvoke);
            IAsyncResult refVal = delInstance.BeginInvoke(100, "I am in Delegate Thread", null, null);
            for (int i = 0; i < 300; i++)
                Console.WriteLine("I am in Main Thread {0}", i);
            bool status = delInstance.EndInvoke(refVal);
            Console.WriteLine("Son returns:" + status);
        }
        private bool MyFunction_WaitByEndInvoke(int count, string str)
        {
            for (int i = 0; i < count; i++)
                Console.WriteLine(str + " {0}", i);
            return true;
        }

        // [4]阻塞
        private void MainThread_NoWait()
        {
            MyDelegate delInstance = new MyDelegate(MyFunction_NoWait);
            IAsyncResult refVal = delInstance.BeginInvoke(100, " I am in Delegate Thread",
                                                       null, null);
            //delInstance.EndInvoke(refVal); // block main and wait
        }
        private void MyFunction_NoWait(int count, string str)
        {
            for (int i = 0; i < count; i++)
                Console.WriteLine(str + " {0}", i);
            Console.Read(); // 如果不执行EndInvoke不会执行到这里，因为主线程结束了，但因为这是winform，主窗体一直在，所以还是阻塞的，如果是控制台，不调用EndInvoke会跳过这里
        }

        // [5]不能直接子线程添加控件，解铃还须系铃人
        private void MainThread_AddControlInThread()
        {
            Thread t = new Thread(new ThreadStart(RunInThread_AddControlInThread));
            t.Start();
        }

        private void RunInThread_AddControlInThread()
        {
            AddControl_AddControlInThread();
        }

        private void AddControl_AddControlInThread()
        {
            TextBox textBox1 = new TextBox();
            this.Controls.Add(textBox1); // runtime ERROR
        }

        // [6]入队方式，在子线程上把添加动作入Send队,AddControl_AddControlByEnQueue实际上还是在主线程上完成的
        public delegate void MyDelegateVoidReturn(List<int> l);
        private void MainThread_AddControlByEnQueue()
        {
            Thread t = new Thread(new ThreadStart(RunInThread_AddControlByEnQueue));
            t.Start();
        }
        private void RunInThread_AddControlByEnQueue()
        {
            MyDelegateVoidReturn delInstatnce = new MyDelegateVoidReturn(AddControl_AddControlByEnQueue);
            this.Invoke(delInstatnce, new List<int>() { 1,2}); // SendMessage to Send Queue, block，带参对应委托参数也要带对应
            MessageBox.Show("Hello");
            //Add your code that needs to be executed in separate thread 
            //except UI updation
        }
        private void AddControl_AddControlByEnQueue(List<int> l)
        {
            //TextBox textBox1 = new TextBox();
            //textBox1.Text = string.Join(",", l.ToArray());
            //this.Controls.Add(textBox1);
            // 阻塞执行更明显：控件加完才MessageBox
            for (int i = 0; i < 100; i++)
            {
                TextBox textBox1 = new TextBox();
                this.flowLayoutPanel1.Controls.Add(textBox1);
            }
        }

        // [7]相较于[6]，使用BeginInvoke不等待(Post Queue)，所以MessageBox是添加100个控件之前执行的，但实际上[6][7]都是在主线程执行的，所以不是并行的
        public delegate void MyDelegateVoidReturn_AddControlByEnQueueNoWait();
        private void MainThread_AddControlByEnQueueNoWait()
        {
            Thread t = new Thread(new ThreadStart(RunInThread_AddControlByEnQueueNoWait));
            t.Start();
        }
        private void RunInThread_AddControlByEnQueueNoWait()
        {
            MyDelegateVoidReturn_AddControlByEnQueueNoWait delInstatnce = new MyDelegateVoidReturn_AddControlByEnQueueNoWait(AddControl_AddControlByEnQueueNoWait);
            this.BeginInvoke(delInstatnce);
            MessageBox.Show("Hello");
        }
        private void AddControl_AddControlByEnQueueNoWait()
        {
            for (int i = 0; i < 300; i++)
            {
                TextBox textBox1 = new TextBox();
                this.flowLayoutPanel1.Controls.Add(textBox1);
            }
        }

        // [8]更新控件状态
        private void MainThread_UpdatingLabel()
        {
            Thread t = new Thread(new ThreadStart(UpdateLabelThread));
            t.Start();
        }
        private void UpdateLabelThread()
        {
            //while (true)
            //{
            //    Thread.Sleep(1000); //Do something
            //    if(!this.IsHandleCreated)
            //    {
            //        return; // 主线程如果this关闭销毁了会报错
            //    }

            //    this.Invoke(new MyDelegateVoidReturn_AddControlByEnQueueNoWait(() => {this.label1.Text += ".";}));
            //}

 
            for (int i = 0; i < 200; i++)
            {
                Thread.Sleep(10);

                //if (this.InvokeRequired)
                //{
                //    this.label1.Invoke(new Action(() => this.label1.Text = i.ToString()));  // FixME1:线程未执行完关闭导致异常
                //}

                _context.Post(status => this.label1.Text = i.ToString(), null); // Fixed1: Ohad Schneider : https://stackoverflow.com/questions/661561/how-do-i-update-the-gui-from-another-thread
            }
        }


    }
}
