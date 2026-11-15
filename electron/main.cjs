// Crea-Link desktop app — Electron main process.
// Loads the live Crea-Link site in its own window, so every feature
// (sign-in, group chat, file sharing, AI story assistant) keeps working.
const { app, BrowserWindow, Menu, shell, session, net } = require("electron");
const path = require("path");

const APP_URL = "https://storyweaver-creator-collective.lovable.app";
const APP_ORIGIN = new URL(APP_URL).origin;

// Hosts that must stay inside this window so sign-in can finish here.
const AUTH_HOSTS = new Set([
  "accounts.google.com",
  "oauth2.googleapis.com",
  "auth.lovable.dev",
  "api.lovable.dev",
]);

const isAppUrl = (raw) => {
  try {
    return new URL(raw).origin === APP_ORIGIN;
  } catch {
    return false;
  }
};

const isAuthUrl = (raw) => {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    return (
      AUTH_HOSTS.has(host) ||
      host.endsWith(".lovable.dev") ||
      host === "lovable.dev"
    );
  } catch {
    return false;
  }
};

const OFFLINE_PAGE = `data:text/html;charset=utf-8,${encodeURIComponent(`
<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>Crea-Link</title>
  <style>
    html,body{height:100%;margin:0}
    body{display:flex;align-items:center;justify-content:center;background:#fbf9f6;
         font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;color:#3d3a4a}
    .card{max-width:420px;padding:44px 38px;text-align:center;background:#fff;
          border:1px solid #ece8f2;border-radius:22px;box-shadow:0 18px 48px rgba(60,50,90,.08)}
    h1{font-size:21px;margin:0 0 10px;font-weight:600}
    p{font-size:14px;line-height:1.6;margin:0 0 24px;color:#6d6a78}
    button{font:inherit;font-size:14px;font-weight:600;color:#fff;background:#4a4360;
           border:0;border-radius:12px;padding:11px 26px;cursor:pointer}
    button:hover{background:#3b3550}
  </style></head>
  <body><div class="card">
    <h1>You're offline</h1>
    <p>Crea-Link needs an internet connection for sign-in, group chat and the
       story assistant. Check your connection and try again.</p>
    <button onclick="location.href='${APP_URL}'">Try again</button>
  </div></body>
</html>
`)}`;

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    show: false,
    title: "Crea-Link",
    backgroundColor: "#fbf9f6",
    autoHideMenuBar: false,
    icon: path.join(__dirname, "..", "public", "icon-512.png"),
    webPreferences: {
      // The app runs entirely in the page; nothing here needs Node access.
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: true,
    },
  });

  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.setTitle("Crea-Link");
  mainWindow.on("page-title-updated", (event) => {
    // Keep the app name in the title bar instead of the page's own title.
    event.preventDefault();
    mainWindow.setTitle("Crea-Link");
  });

  // Links to other sites open in the user's real browser.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isAppUrl(url) || isAuthUrl(url)) return { action: "allow" };
    if (/^https?:/i.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });

  // Keep the window on Crea-Link (and sign-in pages); anything else leaves.
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (isAppUrl(url) || isAuthUrl(url)) return;
    if (/^https?:/i.test(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.webContents.on("did-fail-load", (_event, code, _desc, url) => {
    // -3 is the abort from a redirect; only react to real connection failures.
    if (code === -3 || isAppUrl(url) === false) return;
    mainWindow.loadURL(OFFLINE_PAGE);
  });

  mainWindow.loadURL(APP_URL);
}

// One window at a time; a second launch focuses the first.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: "appMenu" },
        { role: "fileMenu" },
        { role: "editMenu" },
        {
          label: "View",
          submenu: [
            { role: "reload" },
            { role: "forceReload" },
            { role: "toggleDevTools" },
            { type: "separator" },
            { role: "resetZoom" },
            { role: "zoomIn" },
            { role: "zoomOut" },
            { type: "separator" },
            { role: "togglefullscreen" },
          ],
        },
        { role: "windowMenu" },
        {
          label: "Help",
          submenu: [
            {
              label: "Crea-Link website",
              click: () => shell.openExternal(APP_URL),
            },
          ],
        },
      ]),
    );

    // Keep the session (so you stay signed in) but drop stale caches on quit.
    const ses = session.defaultSession;
    ses.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// Online status: nudge the window to reconnect when the network returns.
app.on("network-event", (_event, type) => {
  if (type === "online" && mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL(APP_URL);
  }
});
