// Queue.cs
// ------------------------------------------------------------
using System.Threading.Channels;

namespace AutoAgent.Worker;

public interface ITaskQueue
{
    ValueTask EnqueueAsync(TaskRequest request, CancellationToken token);
    ValueTask<TaskRequest> DequeueAsync(CancellationToken token);
}

public sealed class ChannelTaskQueue : ITaskQueue
{
    private readonly Channel<TaskRequest> _channel = Channel.CreateBounded<TaskRequest>(
        new BoundedChannelOptions(1024)
        {
            FullMode = BoundedChannelFullMode.Wait,
            SingleReader = false,
            SingleWriter = false
        });

    public ValueTask EnqueueAsync(TaskRequest request, CancellationToken token)
        => _channel.Writer.WriteAsync(request, token);

    public async ValueTask<TaskRequest> DequeueAsync(CancellationToken token)
    {
        while (token.IsCancellationRequested == false)
        {
            var ready = await _channel.Reader.WaitToReadAsync(token);
            if (ready == false) { continue; }
            var ok = _channel.Reader.TryRead(out var item);
            if (ok) { return item; }
        }
        throw new OperationCanceledException();
    }
}
