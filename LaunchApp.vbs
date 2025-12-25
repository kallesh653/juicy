' ColdDrink Billing System Launcher
' This script starts the app without showing black console windows

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Start Backend Server (hidden)
WshShell.Run "cmd /c cd /d """ & strPath & "\backend"" && node server.js", 0, False

' Wait for backend to start
WScript.Sleep 8000

' Start Frontend (hidden)
WshShell.Run "cmd /c cd /d """ & strPath & "\frontend"" && npm run dev", 0, False

' Wait for frontend to start
WScript.Sleep 5000

' Open browser
WshShell.Run "http://localhost:3000", 1, False
