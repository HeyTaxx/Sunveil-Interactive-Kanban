using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net.Http;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Threading;
using System.Threading.Tasks;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace Sunveil.Host
{
    internal static class Program
    {
        private const string AppUserModelId = "Sunveil.Kanban.Workspace";
        private const string SingleInstanceMutexName = @"Global\Sunveil_Kanban_Host_Mutex_40293";

        [DllImport("shell32.dll", SetLastError = true)]
        private static extern void SetCurrentProcessExplicitAppUserModelID([MarshalAs(UnmanagedType.LPWStr)] string AppID);

        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        [DllImport("user32.dll", SetLastError = true)]
        private static extern IntPtr FindWindow(string? lpClassName, string lpWindowName);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [STAThread]
        private static void Main()
        {
            // 1. Single-Instance Check: If Sunveil is already open, activate it instantly (0 ms)
            using var mutex = new Mutex(true, SingleInstanceMutexName, out bool isOnlyInstance);
            if (!isOnlyInstance)
            {
                ActivateRunningInstance();
                return;
            }

            // Register explicit AUMID so Windows Taskbar pins Sunveil directly, not Edge
            try
            {
                SetCurrentProcessExplicitAppUserModelID(AppUserModelId);
            }
            catch { }

            ApplicationConfiguration.Initialize();
            Application.Run(new MainForm());
        }

        private static void ActivateRunningInstance()
        {
            try
            {
                IntPtr hWnd = FindWindow(null, "Sunveil - Interactive Kanban & Mindmap");
                if (hWnd == IntPtr.Zero)
                {
                    var current = Process.GetCurrentProcess();
                    foreach (var p in Process.GetProcessesByName(current.ProcessName))
                    {
                        if (p.Id != current.Id && p.MainWindowHandle != IntPtr.Zero)
                        {
                            hWnd = p.MainWindowHandle;
                            break;
                        }
                    }
                }

                if (hWnd != IntPtr.Zero)
                {
                    ShowWindow(hWnd, 9); // SW_RESTORE
                    SetForegroundWindow(hWnd);
                }
            }
            catch { }
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
                BackColor = Color.FromArgb(10, 13, 20); // #0a0d14 matching app dark background

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
                try
                {
                    _webView = new WebView2
                    {
                        Dock = DockStyle.Fill,
                        DefaultBackgroundColor = Color.FromArgb(10, 13, 20)
                    };
                    Controls.Add(_webView);

                    string profileDir = Path.Combine(_projectDir, "data", "webview2_profile");
                    Directory.CreateDirectory(profileDir);

                    // High-speed browser switches: disable background telemetry, translators, and heavy sync
                    var envOptions = new CoreWebView2EnvironmentOptions(
                        "--disable-features=TranslateUI,OptimizationHints,MediaRouter,CalculateNativeWinOcclusion " +
                        "--disable-background-networking " +
                        "--disable-component-update " +
                        "--disable-sync " +
                        "--no-first-run " +
                        "--renderer-process-limit=2"
                    );

                    // 1. Concurrently check / start server in background
                    var serverTask = Task.Run(() => EnsureServerRunningAsync());

                    // 2. Initialize WebView2 directly on the STA UI Thread (prevents 0x80010106 RPC_E_CHANGED_MODE!)
                    var env = await CoreWebView2Environment.CreateAsync(null, profileDir, envOptions);
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

                    // Wait for server readiness
                    bool serverReady = await serverTask;
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

            private static async Task<bool> IsPortOpenAsync(int port, int timeoutMs = 40)
            {
                try
                {
                    using var tcp = new TcpClient();
                    var connectTask = tcp.ConnectAsync("127.0.0.1", port);
                    var timeoutTask = Task.Delay(timeoutMs);
                    if (await Task.WhenAny(connectTask, timeoutTask) == connectTask && tcp.Connected)
                    {
                        return true;
                    }
                }
                catch { }
                return false;
            }

            private async Task<bool> EnsureServerRunningAsync()
            {
                string portFile = Path.Combine(_projectDir, "data", "server.port");
                int savedPort = 40293;

                // 1. Check if port is already active
                if (File.Exists(portFile))
                {
                    try
                    {
                        string txt = File.ReadAllText(portFile).Trim();
                        if (int.TryParse(txt, out int p) && p > 0)
                        {
                            savedPort = p;
                        }
                    }
                    catch { }
                }

                if (await IsPortOpenAsync(savedPort, 40))
                {
                    _serverPort = savedPort;
                    return true;
                }

                if (savedPort != 40293 && await IsPortOpenAsync(40293, 40))
                {
                    _serverPort = 40293;
                    return true;
                }

                // 2. Server is not running: start it immediately!
                bool started = StartBackgroundServer();
                if (!started) return false;

                // 3. Ultra-fast poll loop (checks every 25ms instead of waiting 150ms)
                var sw = Stopwatch.StartNew();
                while (sw.ElapsedMilliseconds < 5000)
                {
                    await Task.Delay(25);

                    if (File.Exists(portFile))
                    {
                        try
                        {
                            string txt = File.ReadAllText(portFile).Trim();
                            if (int.TryParse(txt, out int p) && p > 0)
                            {
                                if (await IsPortOpenAsync(p, 30))
                                {
                                    _serverPort = p;
                                    return true;
                                }
                            }
                        }
                        catch { }
                    }

                    if (await IsPortOpenAsync(40293, 30))
                    {
                        _serverPort = 40293;
                        return true;
                    }
                }

                return false;
            }

            private bool StartBackgroundServer()
            {
                string serverJs = Path.Combine(_projectDir, "server.js");
                string serverPs1 = Path.Combine(_projectDir, "server.ps1");
                string nodePath = FindNodeExecutable();

                ProcessStartInfo psi;
                if (File.Exists(serverJs))
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

            private static string FindNodeExecutable()
            {
                // 1. Direct check standard Node path (fastest)
                string std = @"C:\Program Files\nodejs\node.exe";
                if (File.Exists(std)) return std;

                string local = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "node", "node.exe");
                if (File.Exists(local)) return local;

                // 2. Default to "node" (Windows executes from PATH directly without searching)
                return "node";
            }

            protected override void OnFormClosing(FormClosingEventArgs e)
            {
                base.OnFormClosing(e);

                // If this form spawned the server, shut it down
                if (_serverProcess != null && !_serverProcess.HasExited)
                {
                    try
                    {
                        using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(400) };
                        client.GetAsync($"http://127.0.0.1:{_serverPort}/api/shutdown").Wait(300);
                    }
                    catch { }

                    try
                    {
                        if (!_serverProcess.WaitForExit(500))
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
