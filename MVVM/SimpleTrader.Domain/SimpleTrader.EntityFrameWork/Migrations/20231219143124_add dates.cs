using System;
using Microsoft.EntityFrameworkCore.Migrations;

namespace SimpleTrader.EntityFrameWork.Migrations
{
    public partial class adddates : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateJoined",
                table: "Users",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<DateTime>(
                name: "DateProcessed",
                table: "AssetTransactions",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateJoined",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DateProcessed",
                table: "AssetTransactions");
        }
    }
}
