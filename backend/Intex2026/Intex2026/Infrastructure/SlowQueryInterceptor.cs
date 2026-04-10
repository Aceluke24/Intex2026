using System.Data.Common;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Intex2026.Infrastructure;

public sealed class SlowQueryInterceptor : DbCommandInterceptor
{
    private readonly ILogger<SlowQueryInterceptor> _logger;
    private static readonly TimeSpan SlowQueryThreshold = TimeSpan.FromMilliseconds(200);

    public SlowQueryInterceptor(ILogger<SlowQueryInterceptor> logger)
    {
        _logger = logger;
    }

    public override DbDataReader ReaderExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        DbDataReader result)
    {
        LogIfSlow(command, eventData);
        return base.ReaderExecuted(command, eventData, result);
    }

    public override object? ScalarExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        object? result)
    {
        LogIfSlow(command, eventData);
        return base.ScalarExecuted(command, eventData, result);
    }

    public override int NonQueryExecuted(
        DbCommand command,
        CommandExecutedEventData eventData,
        int result)
    {
        LogIfSlow(command, eventData);
        return base.NonQueryExecuted(command, eventData, result);
    }

    private void LogIfSlow(DbCommand command, CommandExecutedEventData eventData)
    {
        if (eventData.Duration < SlowQueryThreshold)
        {
            return;
        }

        _logger.LogWarning(
            "Slow SQL query detected ({DurationMs}ms): {CommandText}",
            Math.Round(eventData.Duration.TotalMilliseconds, 1),
            command.CommandText);
    }
}
