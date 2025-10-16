var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddAuthorization();

// App services
builder.Services.AddSingleton<SudokuApi.Repositories.IDiagramRepository, SudokuApi.Repositories.SupabaseDiagramRepository>();
builder.Services.AddSingleton<SudokuApi.Services.DiagramService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var summaries = new[]
{
    "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
};

app.MapGet("/weatherforecast", () =>
{
    var forecast =  Enumerable.Range(1, 5).Select(index =>
        new WeatherForecast
        (
            DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            Random.Shared.Next(-20, 55),
            summaries[Random.Shared.Next(summaries.Length)]
        ))
        .ToArray();
    return forecast;
})
.WithName("GetWeatherForecast");

app.MapGet("/diagrams", async (
    HttpRequest request,
    SudokuApi.Services.DiagramService service,
    CancellationToken cancellationToken) =>
{
    // Public mode: no authentication required. Use a shared scope identifier.
    var userId = "public";

    int? page = null;
    int? limit = null;
    string? sortBy = null;
    string? filter = null;

    if (int.TryParse(request.Query["page"], out var p)) page = p;
    if (int.TryParse(request.Query["limit"], out var l)) limit = l;
    sortBy = request.Query["sortBy"].ToString();
    filter = request.Query["filter"].ToString();

    var validation = service.ValidateQuery(page, limit, sortBy, filter);
    if (validation.Error is not null)
    {
        return Results.BadRequest(new { error = validation.Error });
    }

    try
    {
        var (items, total) = await service.ListAsync(
            userId,
            validation.Page,
            validation.Limit,
            validation.SortBy,
            validation.Filter,
            cancellationToken);

        var data = items.Select(i => new
        {
            id = i.Id,
            name = i.Name,
            definition = i.Definition,
            solution = i.Solution,
            created_at = i.CreatedAt,
            updated_at = i.UpdatedAt
        }).ToArray();

        return Results.Ok(new
        {
            data,
            pagination = new { page = validation.Page, limit = validation.Limit, total }
        });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to list diagrams");
        return Results.Problem(statusCode: 500, title: "Internal Server Error");
    }
});

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
