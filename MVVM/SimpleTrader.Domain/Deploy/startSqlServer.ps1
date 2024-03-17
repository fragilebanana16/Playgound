# Check if the script is running with administrator privileges
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    # Relaunch the script with administrator privileges
    Start-Process powershell.exe "-File",('"{0}"' -f $MyInvocation.MyCommand.Path) -Verb RunAs
    exit
}

# Now running with elevated privileges, start the SQL Server service
# Replace 'MSSQL$SQLEXPRESS' with the name of your SQL Server instance
Start-Service -Name 'MSSQL$SQLEXPRESS'