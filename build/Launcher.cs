using System;
using System.Diagnostics;
using System.IO;
using System.Windows.Forms;

namespace Sunveil
{
    static class Launcher
    {
        [STAThread]
        static void Main()
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                Directory.SetCurrentDirectory(baseDir);

                string serverJs = Path.Combine(baseDir, "server.js");
                string serverPs1 = Path.Combine(baseDir, "server.ps1");

                if (!File.Exists(serverJs) && !File.Exists(serverPs1))
                {
                    MessageBox.Show(
                        "Could not locate server.js or server.ps1 in:\n" + baseDir,
                        "Sunveil Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    return;
                }

                // Locate Node.js executable
                string nodePath = FindNodeExecutable();

                ProcessStartInfo psi;
                if (!string.IsNullOrEmpty(nodePath) && File.Exists(serverJs))
                {
                    psi = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = "\"" + serverJs + "\"",
                        WorkingDirectory = baseDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                }
                else
                {
                    // Fallback to Windows PowerShell
                    psi = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = "-WindowStyle Hidden -ExecutionPolicy Bypass -File \"" + serverPs1 + "\"",
                        WorkingDirectory = baseDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                }

                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error launching Sunveil:\n" + ex.Message,
                    "Sunveil",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Warning
                );
            }
        }

        private static string FindNodeExecutable()
        {
            // 1. Check in PATH
            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (pathEnv != null)
            {
                string[] paths = pathEnv.Split(';');
                foreach (string p in paths)
                {
                    if (string.IsNullOrEmpty(p) || string.IsNullOrEmpty(p.Trim())) continue;
                    try
                    {
                        string candidate = Path.Combine(p.Trim(), "node.exe");
                        if (File.Exists(candidate)) return candidate;
                    }
                    catch { }
                }
            }

            // 2. Common install locations
            string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
            string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

            string[] commonLocations = new string[]
            {
                Path.Combine(programFiles, "nodejs", "node.exe"),
                @"C:\Program Files\nodejs\node.exe",
                @"C:\Program Files (x86)\nodejs\node.exe",
                Path.Combine(localAppData, "Programs", "node", "node.exe"),
                Path.Combine(localAppData, "nvm", "current", "node.exe")
            };

            foreach (string loc in commonLocations)
            {
                if (File.Exists(loc)) return loc;
            }

            return null;
        }
    }
}
