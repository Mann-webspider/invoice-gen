# Packaging

Targets: **Windows 10/11** and **macOS 12 Monterey or later**, Intel and Apple
Silicon.

```bash
npm install          # runs electron-builder install-app-deps, which rebuilds
                     # better-sqlite3 against Electron's ABI for this platform
npm run build:win    # on Windows
npm run build:mac    # on macOS
```

Output lands in `release/`.

| Platform | Artifact | Size |
|---|---|---|
| Windows | `InvoiceGen-Setup-1.0.0.exe` | ~86 MB |
| macOS | `InvoiceGen-1.0.0-x64.dmg`, `InvoiceGen-1.0.0-arm64.dmg` | ~100 MB each |

## Each platform must be built on itself

This is not a preference. The app carries two native modules —
`better-sqlite3` and `@node-rs/argon2` — compiled per platform and
architecture, and `.dmg` creation uses macOS-only tooling. Building the macOS
app from Windows produces something that will not start.

Use a Mac, or a CI runner per platform. Everything else in the repository is
platform independent.

## Where data lives

| Platform | Folder |
|---|---|
| Windows | `%APPDATA%\InvoiceGen` |
| macOS | `~/Library/Application Support/InvoiceGen` |

Both hold `data/invoice.db`, `backups/`, `assets/` and `documents/`. Neither is
touched by an uninstall — `deleteAppDataOnUninstall` is off deliberately,
because that folder holds every invoice the client has.

## Windows notes

Per-user install under `%LOCALAPPDATA%`, so no administrator prompt on a
locked-down office machine. The client can change the install directory.

**Not code signed.** SmartScreen warns on first run and the client has to choose
"More info" → "Run anyway". Fixing that needs an Authenticode certificate; add
it under `win` in `electron-builder.yml`.

### If the build fails on symbolic links

```
ERROR: Cannot create symbolic link : A required privilege is not held by the client.
  ... winCodeSign\...\darwin\10.12\lib\libcrypto.dylib
```

electron-builder downloads a code-signing toolchain containing macOS symlinks,
and extracting those needs a privilege ordinary Windows accounts do not have.
Nothing in that archive matters to an unsigned build except `rcedit`, which
stamps the icon and version into `InvoiceGen.exe`.

Either:

- **Enable Developer Mode** (Settings → System → For developers), then
  `npm run build:win` works and the executable gets its icon; or
- run `npm run build:win:nostamp`, which skips stamping. The installer still
  carries the icon, but `InvoiceGen.exe` and its shortcuts show Electron's
  default one.

Prefer the first for anything given to the client.

## macOS notes

**Not signed or notarised.** Gatekeeper refuses to open it from a double click;
the client has to right-click → Open the first time, or run:

```bash
xattr -dr com.apple.quarantine /Applications/InvoiceGen.app
```

`hardenedRuntime` is off for the same reason — enabling it without signing makes
Gatekeeper refuse outright rather than merely warn. Turn it on together with
signing and notarisation once the client has an Apple Developer account:

```yaml
mac:
  hardenedRuntime: true
  notarize:
    teamId: <team id>
```

The app menu in `src/main/menu.ts` is required on macOS, not decoration:
without an Edit menu carrying the cut/copy/paste roles, Cmd+C and Cmd+V do
nothing anywhere in the application, including inside text fields.

Closing the last window leaves the app running, as macOS expects; the dock icon
reopens it.

## LibreOffice

Not bundled on either platform. The app produces Excel and Word files itself;
PDFs need LibreOffice, which the first-run screen detects and links to.
Everything except the PDF step works without it.

| Platform | Looked for |
|---|---|
| Windows | `C:\Program Files\LibreOffice\program\soffice.exe`, the x86 variant, then `HKLM\SOFTWARE\LibreOffice\UNO\InstallPath` |
| macOS | `/Applications/LibreOffice.app/Contents/MacOS/soffice`, `/usr/local/bin/soffice`, then `which soffice` |

The first-run screen has a **Check again** button, so the client can install
LibreOffice without restarting the app.

## Regenerating the icon

`npm run make:icon` writes `build/icon.ico` (Windows, six sizes) and
`build/icon.png` at 1024px, which electron-builder converts to the macOS
`.icns`. Replace both with designed artwork when the client supplies it —
nothing else has to change.
