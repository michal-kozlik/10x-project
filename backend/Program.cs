using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Configure JWT Authentication
var jwtSecret = builder.Configuration["Jwt:Secret"] 
    ?? throw new InvalidOperationException("JWT Secret is not configured");
var jwtIssuer = builder.Configuration["Jwt:Issuer"] 
    ?? throw new InvalidOperationException("JWT Issuer is not configured");
var jwtAudience = builder.Configuration["Jwt:Audience"] 
    ?? throw new InvalidOperationException("JWT Audience is not configured");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var isDevelopment = builder.Environment.IsDevelopment();
        
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = !isDevelopment,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = !isDevelopment,
            ValidIssuers = new[] { jwtIssuer, "supabase", "supabase-demo", "https://htxfsiqfmtzgrcxwoxco.supabase.co/auth/v1" },
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            NameClaimType = "sub"
        };
        
        // In development, skip signature validation to work with any Supabase JWT
        if (isDevelopment)
        {
            options.TokenValidationParameters.RequireSignedTokens = false;
        }
        
        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                if (context.Exception != null)
                {
                    context.HttpContext.RequestServices
                        .GetRequiredService<ILogger<Program>>()
                        .LogWarning(context.Exception, "JWT Authentication failed");
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();

// App services
builder.Services.AddSingleton<SudokuApi.Repositories.IDiagramRepository, SudokuApi.Repositories.SupabaseDiagramRepository>();
builder.Services.AddSingleton<SudokuApi.Services.ISudokuSolver, SudokuApi.Services.BasicSudokuSolver>();
builder.Services.AddSingleton<SudokuApi.Services.DiagramService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
    app.MapOpenApi();

//app.UseHttpsRedirection();

// Add authentication and authorization middleware
app.UseAuthentication();
app.UseAuthorization();

// Health check endpoint for monitoring and load balancers
app.MapGet("/health", () => Results.Ok(new
{
    status = "healthy",
    timestamp = DateTime.UtcNow,
    version = "1.0.0"
}))
.AllowAnonymous()
.WithName("HealthCheck")
.WithTags("Health");

// Helper method to extract user ID from JWT token
static string? GetUserIdFromContext(HttpContext context, ILogger logger)
{
    // Log all claims for debugging
    if (context.User.Identity?.IsAuthenticated == true)
    {
        logger.LogInformation("User is authenticated. Claims:");
        foreach (var claim in context.User.Claims)
        {
            logger.LogInformation("  {Type}: {Value}", claim.Type, claim.Value);
        }
    }
    else
    {
        logger.LogWarning("User is not authenticated");
    }
    
    var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                 ?? context.User.FindFirst("sub")?.Value;
    
    if (userId != null)
    {
        logger.LogInformation("Extracted user ID: {UserId}", userId);
    }
    else
    {
        logger.LogWarning("Could not extract user ID from token");
    }
    
    return userId;
}

app.MapPost("/diagrams", async (
    HttpRequest request,
    HttpContext context,
    SudokuApi.Services.DiagramService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    // Extract user ID from JWT token
    var userId = GetUserIdFromContext(context, logger);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    try
    {
        using var reader = new StreamReader(request.Body);
        var json = await reader.ReadToEndAsync(cancellationToken);
        var data = System.Text.Json.JsonDocument.Parse(json).RootElement;

        var name = data.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? string.Empty : string.Empty;
        var definition = data.TryGetProperty("definition", out var defElement) ? defElement.GetString() : null;

        if (definition == null)
            return Results.BadRequest(new { code = "VALIDATION_ERROR", message = "definition must be provided", details = (string?)null });

        var record = await service.CreateDiagramAsync(userId, name, definition, cancellationToken);
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
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to create diagram");
        return Results.Problem(statusCode: 500, title: "Internal Server Error");
    }
});

app.MapPut("/diagrams/{id:long}", async (
    long id,
    HttpRequest request,
    HttpContext context,
    SudokuApi.Services.DiagramService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    // Extract user ID from JWT token
    var userId = GetUserIdFromContext(context, logger);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    try
    {
        using var reader = new StreamReader(request.Body);
        var json = await reader.ReadToEndAsync(cancellationToken);
        var data = System.Text.Json.JsonDocument.Parse(json).RootElement;

        var name = data.TryGetProperty("name", out var nameElement) ? nameElement.GetString() ?? string.Empty : string.Empty;
        var definition = data.TryGetProperty("definition", out var defElement) ? defElement.GetString() : null;

        if (definition == null)
            return Results.BadRequest(new { code = "VALIDATION_ERROR", message = "definition must be provided", details = (string?)null });

        var record = await service.UpdateDiagramAsync(id, userId, name, definition, cancellationToken);
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
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to update diagram {DiagramId}", id);
        return Results.Problem(statusCode: 500, title: "Internal Server Error");
    }
});

app.MapGet("/diagrams", async (
    HttpRequest request,
    HttpContext context,
    SudokuApi.Services.DiagramService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    // Extract user ID from JWT token
    var userId = GetUserIdFromContext(context, logger);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    int? page = null;
    int? limit = null;
    string? sortBy = null;
    string? filter = null;

    if (int.TryParse(request.Query["page"], out var p))
        page = p;
    if (int.TryParse(request.Query["limit"], out var l))
        limit = l;
    sortBy = request.Query["sortBy"].ToString();
    filter = request.Query["filter"].ToString();

    var validation = service.ValidateQuery(page, limit, sortBy, filter);
    if (validation.Error is not null)
        return Results.BadRequest(new { error = validation.Error });

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
    HttpContext context,
    SudokuApi.Services.DiagramService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    // Extract user ID from JWT token
    var userId = GetUserIdFromContext(context, logger);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    if (id <= 0)
        return Results.BadRequest(new { code = "VALIDATION_ERROR", message = "id must be a positive integer", details = (string?)null });

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

app.MapDelete("/diagrams/{id:long}", async (
    long id,
    HttpContext context,
    SudokuApi.Services.DiagramService service,
    ILogger<Program> logger,
    CancellationToken cancellationToken) =>
{
    // Extract user ID from JWT token
    var userId = GetUserIdFromContext(context, logger);
    if (string.IsNullOrEmpty(userId))
        return Results.Unauthorized();

    try
    {
        await service.DeleteDiagramAsync(id, userId, cancellationToken);
        return Results.Ok(new { message = "Diagram został usunięty." });
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
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Failed to delete diagram {DiagramId}", id);
        return Results.Problem(statusCode: 500, title: "Internal Server Error");
    }
})
.WithName("DeleteDiagram");

app.Run();
