using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Sunveil.Host
{
    internal static class Program
    {
        private const string AppUserModelId = "Sunveil.Kanban.Workspace";

        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        [STAThread]
        private static void Main()
        {
            // Register explicit AUMID so Windows Taskbar pins Sunveil directly, not Edge
            try
            {
                SetCurrentProcessExplicitAppUserModelID(AppUserModelId);
            }
            catch { }

            ApplicationConfiguration.Initialize();
            Application.Run(new MainForm());
        }

        internal class MainForm : Form
        {
            private WebView2? _webView;
            private Process? _serverProcess;
            private int _serverPort = 40293;
            private readonly string _projectDir;

            public MainForm()
            {
                _projectDir = AppDomain.CurrentDomain.BaseDirectory;
                Directory.SetCurrentDirectory(_projectDir);

                Text = "Sunveil - Interactive Kanban & Mindmap";
                StartPosition = FormStartPosition.CenterScreen;
                ClientSize = new Size(1540, 960);
                MinimumSize = new Size(800, 600);
                BackColor = Color.FromArgb(15, 23, 42); // #0f172a dark slate to avoid flash

                // Set application and window icon
                string iconPath = Path.Combine(_projectDir, "app.ico");
                if (!File.Exists(iconPath))
                {
                    iconPath = Path.Combine(_projectDir, "build", "app.ico");
                }
                if (File.Exists(iconPath))
                {
                    try { Icon = new Icon(iconPath); } catch { }
                }

                // Enable Windows DWM dark title bar
                ApplyDarkTitleBar();

                InitializeApp();
            }

            private void ApplyDarkTitleBar()
            {
                try
                {
                    int darkMode = 1;
                    // DWMWA_USE_IMMERSIVE_DARK_MODE = 20
                    DwmSetWindowAttribute(Handle, 20, ref darkMode, sizeof(int));
                }
                catch { }
            }

            private async void InitializeApp()
            {
                // Ensure server is running
                bool serverReady = await EnsureServerRunningAsync();
                if (!serverReady)
                {
                    MessageBox.Show(
                        "Unable to connect to local Sunveil server.\nPlease check node.js installation.",
                        "Sunveil Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                    Close();
                    return;
                }

                // Initialize WebView2
                try
                {
                    _webView = new WebView2
                    {
                        Dock = DockStyle.Fill,
                        DefaultBackgroundColor = Color.FromArgb(15, 23, 42)
                    };
                    Controls.Add(_webView);

                    string profileDir = Path.Combine(_projectDir, "data", "webview2_profile");
                    Directory.CreateDirectory(profileDir);

                    var env = await CoreWebView2Environment.CreateAsync(null, profileDir);
                    await _webView.EnsureCoreWebView2Async(env);

                    // Configure browser settings
                    _webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
                    _webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                    _webView.CoreWebView2.Settings.AreDevToolsEnabled = true;

                    // Sync window title with web app document title
                    _webView.CoreWebView2.DocumentTitleChanged += (s, e) =>
                    {
                        if (!string.IsNullOrWhiteSpace(_webView.CoreWebView2.DocumentTitle))
                        {
                            Text = _webView.CoreWebView2.DocumentTitle;
                        }
                    };

                    string targetUrl = $"http://127.0.0.1:{_serverPort}/index.html";
                    _webView.CoreWebView2.Navigate(targetUrl);
                }
                catch (Exception ex)
                {
                    MessageBox.Show(
                        "Failed to initialize WebView2:\n" + ex.Message,
                        "Sunveil - WebView2 Error",
                        MessageBoxButtons.OK,
                        MessageBoxIcon.Error
                    );
                }
            }

            private async Task<bool> EnsureServerRunningAsync()
            {
                using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(600) };

                // 1. Check if port is recorded in data/server.port
                string portFile = Path.Combine(_projectDir, "data", "server.port");
                if (File.Exists(portFile))
                {
                    try
                    {
                        string txt = File.ReadAllText(portFile).Trim();
                        if (int.TryParse(txt, out int savedPort))
                        {
                            if (await TryPingAsync(client, savedPort))
                            {
                                _serverPort = savedPort;
                                return true;
                            }
                        }
                    }
                    catch { }
                }

                // 2. Check default port 40293
                if (await TryPingAsync(client, 40293))
                {
                    _serverPort = 40293;
                    return true;
                }

                // 3. Start local server in background
                bool started = StartBackgroundServer();
                if (!started) return false;

                // Wait up to 6 seconds for server to respond
                var sw = Stopwatch.StartNew();
                while (sw.ElapsedMilliseconds < 6000)
                {
                    await Task.Delay(150);

                    if (File.Exists(portFile))
                    {
                        try
                        {
                            string txt = File.ReadAllText(portFile).Trim();
                            if (int.TryParse(txt, out int p))
                            {
                                if (await TryPingAsync(client, p))
                                {
                                    _serverPort = p;
                                    return true;
                                }
                            }
                        }
                        catch { }
                    }

                    if (await TryPingAsync(client, 40293))
                    {
                        _serverPort = 40293;
                        return true;
                    }
                }

                return false;
            }

            private static async Task<bool> TryPingAsync(HttpClient client, int port)
            {
                try
                {
                    var res = await client.GetAsync($"http://127.0.0.1:{port}/api/ping");
                    return res.IsSuccessStatusCode;
                }
                catch
                {
                    return false;
                }
            }

            private bool StartBackgroundServer()
            {
                string serverJs = Path.Combine(_projectDir, "server.js");
                string serverPs1 = Path.Combine(_projectDir, "server.ps1");
                string? nodePath = FindNodeExecutable();

                ProcessStartInfo psi;
                if (!string.IsNullOrEmpty(nodePath) && File.Exists(serverJs))
                {
                    psi = new ProcessStartInfo
                    {
                        FileName = nodePath,
                        Arguments = $"\"{serverJs}\" --no-browser",
                        WorkingDirectory = _projectDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                }
                else if (File.Exists(serverPs1))
                {
                    psi = new ProcessStartInfo
                    {
                        FileName = "powershell.exe",
                        Arguments = $"-WindowStyle Hidden -ExecutionPolicy Bypass -File \"{serverPs1}\" -NoBrowser",
                        WorkingDirectory = _projectDir,
                        CreateNoWindow = true,
                        UseShellExecute = false,
                        WindowStyle = ProcessWindowStyle.Hidden
                    };
                }
                else
                {
                    return false;
                }

                try
                {
                    _serverProcess = Process.Start(psi);
                    return _serverProcess != null;
                }
                catch
                {
                    return false;
                }
            }

            private static string? FindNodeExecutable()
            {
                string? pathEnv = Environment.GetEnvironmentVariable("PATH");
                if (pathEnv != null)
                {
                    foreach (string p in pathEnv.Split(';'))
                    {
                        if (string.IsNullOrWhiteSpace(p)) continue;
                        try
                        {
                            string candidate = Path.Combine(p.Trim(), "node.exe");
                            if (File.Exists(candidate)) return candidate;
                        }
                        catch { }
                    }
                }

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

            protected override void OnFormClosing(FormClosingEventArgs e)
            {
                base.OnFormClosing(e);

                // If this form spawned the server, shut it down
                if (_serverProcess != null && !_serverProcess.HasExited)
                {
                    try
                    {
                        using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(500) };
                        client.GetAsync($"http://127.0.0.1:{_serverPort}/api/shutdown").Wait(400);
                    }
                    catch { }

                    try
                    {
                        if (!_serverProcess.WaitForExit(800))
                        {
                            _serverProcess.Kill();
                        }
                    }
                    catch { }
                }
            }
        }
    }
}
