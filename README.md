# Facebook Session Manager

An Electron application for managing Facebook sessions with export and import capabilities for automation and testing purposes.

## 📋 Key Features

- 🔐 **Facebook Login** with Chrome user agent to avoid detection
- 💾 **Export Session** - Save cookies and localStorage in JSON format
- 📂 **Load Session** - Import previously saved sessions for automatic login
- 🧹 **Clear Session** - Remove all session data for logout
- 🛡️ **Anti-Detection** - Bypass bot detection with user agent and fake browser properties
- 📱 **Cross-Platform** - Runs on Windows, macOS, and Linux

## 🚀 Installation and Setup

### Prerequisites

- Node.js version 22 (use nvm)
- Bun package manager

### Install Dependencies

```bash
# Set Node.js version
nvm use 22

# Install dependencies
bun install
```

## 🎯 How to Use

### 1. Running the Application

```bash
# Make sure to use Node.js v22
nvm use 22

# Run the application
bun run start
```

### 2. Login to Facebook

1. The application will automatically open a window with Facebook
2. Login using your Facebook account
3. Wait until login is successful

### 3. Export Session (Download Session)

1. After successful login, click menu **Session** → **Download Session**
2. Choose location to save the session file (`.json` format)
3. File will contain cookies and localStorage data
4. You'll see notification "✅ session downloaded successfully!"

### 4. Load Session (Import Session)

1. Click menu **Session** → **Load Session**
2. Select the `.json` session file you saved previously
3. The application will:
   - Clear old cookies
   - Load cookies from file
   - Load localStorage data
   - Navigate to Facebook
4. You'll see notification "✅ Session loaded successfully!"

### 5. Clear Session (Logout)

1. Click menu **Session** → **Clear Session**
2. The application will remove all:
   - Cookies
   - localStorage
   - sessionStorage
   - Cache data
3. Facebook page will refresh in logged out state

## 📁 Menu Structure

```
Session Menu:
├── Load Session     - Import session from JSON file
├── Clear Session    - Remove all session data (logout)
└── Download Session - Export session to JSON file
```

## 🔧 NPM Scripts

```bash
# Run development application
bun run start

# Build application for production
bun run package

# Create installer/distributable for all platforms
bun run make

# Platform-specific builds
bun run make:win       # Windows (.exe)
bun run make:mac       # macOS (.dmg)
bun run make:linux     # Linux (.deb, .rpm)

# Package without installer
bun run package:win    # Windows package
bun run package:mac    # macOS package  
bun run package:linux  # Linux package

# Build for all platforms at once
bun run build:all

# Lint code
bun run lint
```

## 📦 Build Outputs

After building, you'll find the distributable files in:

### macOS (.dmg)
- **Location**: `out/make/Facebook Session Manager.dmg`
- **Size**: ~105MB
- **Architecture**: ARM64 (Apple Silicon)

### macOS (.zip) 
- **Location**: `out/make/zip/darwin/arm64/Facebook Session Manager-darwin-arm64-1.0.0.zip`
- **Size**: ~105MB  
- **Use case**: Alternative distribution format

### Application Bundle
- **Location**: `out/Facebook Session Manager-darwin-arm64/Facebook Session Manager.app`
- **Use case**: Direct execution without installer

## 🏗️ Building for Windows (.exe)

To build Windows executables from macOS, you'll need:

```bash
# Install Wine (for cross-compilation)
brew install --cask wine-stable

# Build Windows version
bun run make:win
```

**Note**: Cross-platform building may require additional setup. For best results, build Windows executables on a Windows machine.

## 🚀 Running the Application

### From DMG (Recommended)
1. Download `Facebook Session Manager.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. Launch from Applications

### From ZIP
1. Download and extract the ZIP file  
2. Right-click the app → Open
3. Confirm security dialog if needed

### Direct Execution
```bash
cd out/Facebook\ Session\ Manager-darwin-arm64/
open Facebook\ Session\ Manager.app
```

## 📄 Session File Format

The exported session file has JSON format like this:

```json
{
  "cookies": [
    {
      "name": "c_user",
      "value": "100000000000000",
      "domain": ".facebook.com",
      "path": "/",
      "secure": true,
      "httpOnly": false,
      "sameSite": "Lax"
    }
  ],
  "origins": [
    {
      "origin": "https://www.facebook.com",
      "localStorage": [
        {
          "name": "key",
          "value": "value"
        }
      ]
    }
  ]
}
```

## 🛡️ Anti-Detection Features

This application uses several techniques to avoid detection:

- **Chrome User Agent** - Disguise as genuine Chrome browser
- **Remove webdriver flag** - Remove webdriver signature
- **Fake chrome object** - Add window.chrome property
- **Plugin spoofing** - Fake browser plugin list
- **Language settings** - Set realistic browser language

## 📝 Logging and Debugging

The application will display logs in console for:

- ✅ Successful login status
- 🍪 Number of cookies loaded
- 📂 Session file path being loaded
- ⚠️ Error handling for troubleshooting

## ⚠️ Troubleshooting

### Error "Session belum tersedia" (Session not available)
- Make sure you're logged into Facebook first
- Cookie `c_user` must exist (indicates successful login)

### Error when Loading Session
- Make sure JSON file format is correct
- Check that session file is not corrupted
- Ensure file path is accessible

### Application won't start
- Make sure you're using Node.js v22: `nvm use 22`
- Reinstall dependencies: `bun install`
- Check no Electron processes are still running

## 🚨 Disclaimer

⚠️ **Important**: This application is created for educational and testing purposes. Usage for scraping or automation that violates Facebook ToS is the user's responsibility. Use wisely and according to platform policies.

## 📞 Support

If you have any issues or questions, please create an issue in this repository.

## 📄 License

MIT License - see LICENSE file for full details.

---

**Made with ❤️ using Electron, TypeScript, and Vite**
