Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get paths
strDesktop = WshShell.SpecialFolders("Desktop")
strCurrentDir = fso.GetParentFolderName(WScript.ScriptFullName)
strIconPath = strCurrentDir & "\electron\assets\app.ico"

' Create shortcut
Set oShortcut = WshShell.CreateShortcut(strDesktop & "\Juicy Billing.lnk")
oShortcut.TargetPath = "wscript.exe"
oShortcut.Arguments = """" & strCurrentDir & "\LaunchJuicy.vbs"""
oShortcut.WorkingDirectory = strCurrentDir
oShortcut.Description = "Juicy - Professional POS Billing System"
oShortcut.WindowStyle = 7
oShortcut.IconLocation = strIconPath & ",0"
oShortcut.Save

MsgBox "Shortcut created with coffee icon!", vbInformation, "Juicy Billing"
