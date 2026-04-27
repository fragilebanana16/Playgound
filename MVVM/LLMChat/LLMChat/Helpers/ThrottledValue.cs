using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;

namespace LLMChat.Helpers;

public class ThrottledValue<T>
{
    private T _latestValue;
    private readonly Action<T> _updateAction;
    private readonly System.Timers.Timer _timer;
    private bool _needsUpdate;

    public ThrottledValue(Action<T> updateAction, double intervalMs = 100)
    {
        _updateAction = updateAction;
        _timer = new System.Timers.Timer(intervalMs);
        _timer.Elapsed += (s, e) => Tick();
        _timer.AutoReset = true;
        _timer.Start();
    }

    // 收到新值时，只暂存，不更新 UI
    public void Update(T value)
    {
        _latestValue = value;
        _needsUpdate = true;
    }

    private void Tick()
    {
        if (_needsUpdate)
        {
            _needsUpdate = false;
            // 切换回 UI 线程执行最终更新
            Application.Current.Dispatcher.BeginInvoke(() =>
            {
                _updateAction?.Invoke(_latestValue);
            });
        }
    }
}
