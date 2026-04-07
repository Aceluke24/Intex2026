using Microsoft.AspNetCore.Identity;
using Intex2026.Models;
using System;

namespace Intex2026.Data
{
    public class AuthIdentityGenerator
    {
        public static async Task GenerateDefaultIdentityAsync(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

            foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor })
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    var createRoleResults = await roleManager.CreateAsync(new IdentityRole(roleName));

                    if (!createRoleResults.Succeeded)
                    {
                        throw new Exception($"Failed to create role '{roleName}': {string.Join(", ", createRoleResults.Errors.Select(e => e.Description))}");
                    }
                }
            }
        
            var adminSection = configuration.GetSection("GenerateDefaultIdentityAdmin");
            var adminEmail = adminSection["Email"] ?? "admin@northstarsanctuary.org";
            var adminPassword = adminSection["Password"] ?? "administhecorrectpassword!";
            var environmentName = configuration["ASPNETCORE_ENVIRONMENT"];
            var isDevelopment = string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase);

            var adminUser = await userManager.FindByEmailAsync(adminEmail);
            if (adminUser == null)
            {
                adminUser = new ApplicationUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true
                };

                var createAdminResult = await userManager.CreateAsync(adminUser, adminPassword);
                if (!createAdminResult.Succeeded)
                {
                    throw new Exception($"Failed to create admin user: {string.Join(", ", createAdminResult.Errors.Select(e => e.Description))}");
                }
            }

            if (isDevelopment)
            {
                var passwordMatches = await userManager.CheckPasswordAsync(adminUser, adminPassword);
                if (!passwordMatches)
                {
                    IdentityResult passwordResult;

                    if (await userManager.HasPasswordAsync(adminUser))
                    {
                        var resetToken = await userManager.GeneratePasswordResetTokenAsync(adminUser);
                        passwordResult = await userManager.ResetPasswordAsync(adminUser, resetToken, adminPassword);
                    }
                    else
                    {
                        passwordResult = await userManager.AddPasswordAsync(adminUser, adminPassword);
                    }

                    if (!passwordResult.Succeeded)
                    {
                        throw new Exception($"Failed to set admin password: {string.Join(", ", passwordResult.Errors.Select(e => e.Description))}");
                    }
                }
            }

            if (!await userManager.IsInRoleAsync(adminUser, AuthRoles.Admin))
            {
                var addToRoleResult = await userManager.AddToRoleAsync(adminUser, AuthRoles.Admin);
                if (!addToRoleResult.Succeeded)
                {
                    throw new Exception($"Failed to assign admin role to user: {string.Join(", ", addToRoleResult.Errors.Select(e => e.Description))}");
                }
            }
        }
    }
}