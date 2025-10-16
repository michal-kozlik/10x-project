var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddAuthorization();

// App services
builder.Services.AddSingleton<SudokuApi.Repositories.IDiagramRepository, SudokuApi.Repositories.SupabaseDiagramRepository>();
builder.Services.AddSingleton<SudokuApi.Services.ISudokuSolver, SudokuApi.Services.BasicSudokuSolver>();
builder.Services.AddSingleton<SudokuApi.Services.DiagramService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

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

app.MapPost("/diagrams/{id:long}/solve", async (
    long id,
    HttpRequest request,
    SudokuApi.Services.DiagramService service,
    CancellationToken cancellationToken) =>
{
    // TODO: Replace with real auth extraction; public scope for now
    var userId = "public";

    if (id <= 0)
    {
        return Results.BadRequest(new { code = "VALIDATION_ERROR", message = "id must be a positive integer", details = (string?)null });
    }

    try
    {
        var record = await service.GenerateAndSaveSolutionAsync(id, userId, cancellationToken);
        return Results.Ok(new
        {
            id = record.Id,
            name = record.Name,
            definition = record.Definition,
            solution = record.Solution,
            created_at = record.CreatedAt,
            updated_at = record.UpdatedAt
        });
    }
    catch (SudokuApi.Services.DiagramService.ValidationException ex)
    {
        return Results.BadRequest(new { code = "VALIDATION_ERROR", message = ex.Message, details = (string?)null });
    }
    catch (SudokuApi.Services.DiagramService.NotFoundException)
    {
        return Results.NotFound(new { code = "NOT_FOUND", message = "Diagram not found", details = (string?)null });
    }
    catch (SudokuApi.Services.DiagramService.ConflictException ex)
    {
        return Results.Conflict(new { code = "CONFLICT", message = ex.Message, details = (string?)null });
    }
    catch (SudokuApi.Services.DiagramService.UnsolvableException)
    {
        return Results.BadRequest(new { code = "UNSOLVABLE", message = "Diagram jest nierozwiązywalny.", details = (string?)null });
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to solve diagram {DiagramId}", id);
        return Results.Problem(statusCode: 500, title: "Internal Server Error");
    }
})
.WithName("SolveDiagram");

app.Run();

record WeatherForecast(DateOnly Date, int TemperatureC, string? Summary)
{
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
