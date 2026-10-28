using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace SunveilApp
{
    static class Program
    {
        private static TcpListener _server;
        private static string _baseDir;
        private static string _dataFile;
        private static bool _isRunning = true;
        private static int _port;
        private static DateTime _lastHeartbeat = DateTime.UtcNow.AddSeconds(20); // Grace period on startup

        [STAThread]
        static void Main(string[] args)
        {
            string exeDir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(exeDir, "index.html")))
            {
                _baseDir = exeDir;
            }
            else if (File.Exists(Path.Combine(exeDir, "..", "index.html")))
            {
                _baseDir = Path.GetFullPath(Path.Combine(exeDir, ".."));
            }
            else
            {
                _baseDir = exeDir;
            }

            string dataFolder = Path.Combine(_baseDir, "data");
            if (!Directory.Exists(dataFolder))
            {
                Directory.CreateDirectory(dataFolder);
            }
            _dataFile = Path.Combine(dataFolder, "kanban_data.json");

            // Initialize default data file if not present
            if (!File.Exists(_dataFile))
            {
                CreateDefaultDataFile(_dataFile);
            }

            // Pick a free unprivileged port
            _port = GetAvailablePort();

            // Start raw TcpListener HTTP server
            StartHttpServer(_port);

            // Locate browser
            string browserPath = FindBrowserExecutable();
            string profileDir = Path.Combine(dataFolder, "profile");
            string appUrl = string.Format("http://127.0.0.1:{0}/index.html", _port);

            if (!string.IsNullOrEmpty(browserPath))
            {
                string arguments = string.Format(
                    "--app=\"{0}\" --user-data-dir=\"{1}\" --window-size=1540,960 --disable-features=TranslateUI --disable-extensions --no-first-run",
                    appUrl, profileDir
                );

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = browserPath,
                    Arguments = arguments,
                    UseShellExecute = false
                };

                try
                {
                    Process.Start(psi);
                }
                catch
                {
                    Process.Start(appUrl);
                }
            }
            else
            {
                Process.Start(appUrl);
            }

            // Heartbeat watch loop: Keep running as long as the app window is open
            while (_isRunning)
            {
                Thread.Sleep(2000);
                if ((DateTime.UtcNow - _lastHeartbeat).TotalSeconds > 15)
                {
                    // No heartbeat received for 15 seconds -> Window was closed
                    _isRunning = false;
                    break;
                }
            }

            StopHttpServer();
        }

        private static void CreateDefaultDataFile(string path)
        {
            try
            {
                string defaultJson = @"{
  ""title"": ""🚀 Projekt Arbeitsbereich"",
  ""columns"": [
    { ""id"": ""col-1"", ""title"": ""💡 Ideen & Konzepte"", ""color"": ""#6366f1"" },
    { ""id"": ""col-2"", ""title"": ""⚡ In Arbeit"", ""color"": ""#38bdf8"" },
    { ""id"": ""col-3"", ""title"": ""🔍 Review & Test"", ""color"": ""#f59e0b"" },
    { ""id"": ""col-4"", ""title"": ""✅ Erledigt"", ""color"": ""#10b981"" }
  ],
  ""cards"": [
    {
      ""id"": ""card-demo-1"",
      ""columnId"": ""col-2"",
      ""title"": ""Design & Mindmap Workflow"",
      ""order"": 0,
      ""tags"": [{ ""name"": ""UI / UX"", ""color"": ""#6366f1"" }, { ""name"": ""Interaktiv"", ""color"": ""#38bdf8"" }],
      ""mindmap"": {
        ""nodes"": [
          {
            ""id"": ""center-root"",
            ""isCenter"": true,
            ""type"": ""bubble"",
            ""title"": ""Design & Mindmap Workflow"",
            ""content"": ""Zentrale Mindmap für dieses Thema. Alle Notizen & Skizzen werden hier gesammelt."",
            ""x"": 4800,
            ""y"": 4800,
            ""color"": ""#6366f1""
          },
          {
            ""id"": ""node-sub-1"",
            ""type"": ""bubble"",
            ""title"": ""🎨 Farbschema & Stile"",
            ""content"": ""Darkmode mit Akzenten in Indigo, Sky Blue und Emerald."",
            ""x"": 4400,
            ""y"": 4680,
            ""color"": ""#38bdf8""
          },
          {
            ""id"": ""node-sub-2"",
            ""type"": ""bubble"",
            ""title"": ""✏️ Freihand & Skizzen"",
            ""content"": ""Mit dem Stift-Werkzeug können handschriftliche Pfeile, Texte und Skizzen frei gezeichnet werden!"",
            ""x"": 5200,
            ""y"": 4680,
            ""color"": ""#10b981""
          },
          {
            ""id"": ""node-sub-3"",
            ""type"": ""link"",
            ""title"": ""Dokumentation & Vorlage"",
            ""url"": ""https://developer.mozilla.org"",
            ""content"": ""Offizielle Web-Dokumentation & Ressourcen"",
            ""x"": 4800,
            ""y"": 5120,
            ""color"": ""#f59e0b""
          }
        ],
        ""connections"": [
          { ""id"": ""conn-1"", ""fromId"": ""center-root"", ""toId"": ""node-sub-1"", ""color"": ""#38bdf8"" },
          { ""id"": ""conn-2"", ""fromId"": ""center-root"", ""toId"": ""node-sub-2"", ""color"": ""#10b981"" },
          { ""id"": ""conn-3"", ""fromId"": ""center-root"", ""toId"": ""node-sub-3"", ""color"": ""#f59e0b"" }
        ],
        ""drawings"": [
          {
            ""tool"": ""arrow"",
            ""color"": ""#38bdf8"",
            ""size"": 3,
            ""startX"": 4580,
            ""startY"": 4720,
            ""endX"": 4760,
            ""endY"": 4800
          }
        ]
      }
    }
  ]
}";
                File.WriteAllText(path, defaultJson, Encoding.UTF8);
            }
            catch { }
        }

        private static int GetAvailablePort()
        {
            TcpListener l = new TcpListener(IPAddress.Loopback, 0);
            l.Start();
            int port = ((IPEndPoint)l.LocalEndpoint).Port;
            l.Stop();
            return port;
        }

        private static void StartHttpServer(int port)
        {
            _server = new TcpListener(IPAddress.Loopback, port);
            _server.Start();

            Thread thread = new Thread(ServerLoop)
            {
                IsBackground = true
            };
            thread.Start();
        }

        private static void StopHttpServer()
        {
            try
            {
                if (_server != null)
                {
                    _server.Stop();
                }
            }
            catch { }
        }

        private static void ServerLoop()
        {
            while (_isRunning)
            {
                try
                {
                    TcpClient client = _server.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(HandleClient, client);
                }
                catch
                {
                    break;
                }
            }
        }

        private static void HandleClient(object obj)
        {
            TcpClient client = (TcpClient)obj;
            try
            {
                using (NetworkStream stream = client.GetStream())
                {
                    stream.ReadTimeout = 5000;
                    stream.WriteTimeout = 5000;

                    byte[] buffer = new byte[65536];
                    int bytesRead = stream.Read(buffer, 0, buffer.Length);
                    if (bytesRead <= 0) return;

                    string requestHeader = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                    string[] lines = requestHeader.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                    if (lines.Length == 0) return;

                    string[] requestParts = lines[0].Split(' ');
                    if (requestParts.Length < 2) return;

                    string method = requestParts[0].ToUpperInvariant();
                    string path = requestParts[1].Split('?')[0].TrimStart('/');
                    if (string.IsNullOrEmpty(path)) path = "index.html";

                    // Update Heartbeat on any activity
                    _lastHeartbeat = DateTime.UtcNow;

                    // Handle CORS Preflight (OPTIONS)
                    if (method == "OPTIONS")
                    {
                        SendResponse(stream, 204, "No Content", "text/plain", new byte[0]);
                        return;
                    }

                    // Heartbeat ping
                    if (path == "api/ping")
                    {
                        SendResponse(stream, 200, "OK", "application/json", Encoding.UTF8.GetBytes("{\"pong\":true}"));
                        return;
                    }

                    // Explicit close / shutdown from beforeunload
                    if (path == "api/shutdown")
                    {
                        SendResponse(stream, 200, "OK", "application/json", Encoding.UTF8.GetBytes("{\"bye\":true}"));
                        _isRunning = false;
                        return;
                    }

                    // 1. API GET DATA (Load disk JSON)
                    if (path == "api/data" && method == "GET")
                    {
                        byte[] dataBytes;
                        if (File.Exists(_dataFile))
                        {
                            dataBytes = File.ReadAllBytes(_dataFile);
                        }
                        else
                        {
                            dataBytes = Encoding.UTF8.GetBytes("{}");
                        }
                        SendResponse(stream, 200, "OK", "application/json; charset=utf-8", dataBytes);
                        return;
                    }

                    // 2. API POST DATA (Save disk JSON)
                    if (path == "api/data" && method == "POST")
                    {
                        int headerEnd = requestHeader.IndexOf("\r\n\r\n");
                        int bodyStartIndex = headerEnd + 4;
                        int bodyLengthInHeader = bytesRead - bodyStartIndex;

                        int contentLength = 0;
                        foreach (string line in lines)
                        {
                            if (line.StartsWith("Content-Length:", StringComparison.OrdinalIgnoreCase))
                            {
                                int.TryParse(line.Substring(15).Trim(), out contentLength);
                                break;
                            }
                        }

                        using (MemoryStream ms = new MemoryStream())
                        {
                            if (bodyLengthInHeader > 0)
                            {
                                ms.Write(buffer, bodyStartIndex, Math.Min(bodyLengthInHeader, contentLength));
                            }

                            int remaining = contentLength - (int)ms.Length;
                            while (remaining > 0)
                            {
                                int toRead = Math.Min(remaining, buffer.Length);
                                int read = stream.Read(buffer, 0, toRead);
                                if (read <= 0) break;
                                ms.Write(buffer, 0, read);
                                remaining -= read;
                            }

                            byte[] jsonBytes = ms.ToArray();
                            if (jsonBytes.Length > 0)
                            {
                                File.WriteAllBytes(_dataFile, jsonBytes);
                            }
                        }

                        byte[] okBytes = Encoding.UTF8.GetBytes("{\"saved\":true}");
                        SendResponse(stream, 200, "OK", "application/json; charset=utf-8", okBytes);
                        return;
                    }

                    // 3. STATIC FILES
                    string localFile = Path.Combine(_baseDir, path.Replace('/', Path.DirectorySeparatorChar));
                    if (File.Exists(localFile))
                    {
                        byte[] fileBytes = File.ReadAllBytes(localFile);
                        string ext = Path.GetExtension(localFile).ToLowerInvariant();
                        string mime = "application/octet-stream";

                        switch (ext)
                        {
                            case ".html": mime = "text/html; charset=utf-8"; break;
                            case ".css": mime = "text/css; charset=utf-8"; break;
                            case ".js": mime = "application/javascript; charset=utf-8"; break;
                            case ".json": mime = "application/json; charset=utf-8"; break;
                            case ".png": mime = "image/png"; break;
                            case ".jpg":
                            case ".jpeg": mime = "image/jpeg"; break;
                            case ".svg": mime = "image/svg+xml"; break;
                            case ".ico": mime = "image/x-icon"; break;
                            case ".woff2": mime = "font/woff2"; break;
                            case ".woff": mime = "font/woff"; break;
                            case ".ttf": mime = "font/ttf"; break;
                        }

                        SendResponse(stream, 200, "OK", mime, fileBytes);
                    }
                    else
                    {
                        byte[] nf = Encoding.UTF8.GetBytes("Not Found");
                        SendResponse(stream, 404, "Not Found", "text/plain", nf);
                    }
                }
            }
            catch { }
            finally
            {
                try { client.Close(); } catch { }
            }
        }

        private static void SendResponse(NetworkStream stream, int statusCode, string statusText, string contentType, byte[] body)
        {
            StringBuilder sb = new StringBuilder();
            sb.AppendFormat("HTTP/1.1 {0} {1}\r\n", statusCode, statusText);
            sb.AppendFormat("Content-Type: {0}\r\n", contentType);
            sb.AppendFormat("Content-Length: {0}\r\n", body.Length);
            sb.Append("Connection: close\r\n");
            sb.Append("Access-Control-Allow-Origin: *\r\n");
            sb.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
            sb.Append("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With\r\n");
            sb.Append("Cache-Control: no-cache, no-store, must-revalidate\r\n\r\n");

            byte[] headerBytes = Encoding.UTF8.GetBytes(sb.ToString());
            stream.Write(headerBytes, 0, headerBytes.Length);
            if (body.Length > 0)
            {
                stream.Write(body, 0, body.Length);
            }
            stream.Flush();
        }

        private static string FindBrowserExecutable()
        {
            string[] possiblePaths = new string[]
            {
                @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
                @"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Microsoft\Edge\Application\msedge.exe"),
                @"C:\Program Files\Google\Chrome\Application\chrome.exe",
                @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), @"Google\Chrome\Application\chrome.exe")
            };

            foreach (string p in possiblePaths)
            {
                if (File.Exists(p)) return p;
            }

            return null;
        }
    }
}
