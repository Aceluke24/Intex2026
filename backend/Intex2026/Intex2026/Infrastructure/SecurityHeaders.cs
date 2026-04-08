namespace Intex2026.Infrastructure
{
    public static class SecurityHeaders
    {
        public const string ContentSecurityPolicy =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "font-src 'self'; " +
            "connect-src 'self' https://accounts.google.com; " +
            "frame-src https://accounts.google.com; " +
            "base-uri 'self'; " +
            "frame-ancestors 'none'; " +
            "object-src 'none'";

        public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        {
            var environment = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();
            return app.Use(async (context, next) =>
            {
                context.Response.OnStarting(() =>
                {
                    if (!(environment.IsDevelopment() && context.Request.Path.StartsWithSegments("/swagger")))
                    {
                        context.Response.Headers["Content-Security-Policy"] = ContentSecurityPolicy;
                    }

                    return Task.CompletedTask;
                });
                await next();
            });
        }

    }
}