# Web Session Manager

An Electron application for managing web sessions across multiple platforms with export and import capabilities for automation and testing purposes.

## 📋 Key Features

- 🌐 **Multi-Platform Support** - Facebook, Instagram, Twitter/X, LinkedIn, TikTok, Shopee
- 🔄 **Domain Switching** - Easy switching between different platforms
- 🔐 **Session Management** with Chrome user agent to avoid detection
- 💾 **Export Session** - Save cookies and localStorage in JSON format
- 📂 **Load Session** - Import previously saved sessions for automatic login
- 🧹 **Clear Session** - Remove all session data for logout
- 🔗 **Copy Current URL** - Quick URL copying to clipboard
- 🔄 **Reload Page** - Easy page refresh functionality
- 🛡️ **Anti-Detection** - Bypass bot detection with user agent and fake browser properties
- 📱 **Cross-Platform** - Runs on Windows, macOS, and Linux

## 🌐 Supported Platforms

- **Facebook** - Social media session management
- **Instagram** - Content and engagement management
- **Twitter/X** - Social networking and content sharing
- **LinkedIn** - Professional networking
- **TikTok** - Video content platform
- **Shopee** - E-commerce and shopping platform

Each platform has its own optimized cookie identifiers and session handling for reliable authentication.

## 🚀 Installation and Setup

### Prerequisites

- Node.js version 22 (use nvm)
- npm or bun package manager

### Install Dependencies

```bash
# Set Node.js version
nvm use 22

# Install dependencies with npm
npm install

# Or install with bun
bun install
```

## 🎯 How to Use

### 1. Running the Application

```bash
# Make sure to use Node.js v22
nvm use 22

# Run the application with npm
npm run start

# Or run with bun
bun run start
```

### 2. Login to Platform

1. The application will start with Facebook by default
2. Use **Config** → **Change Domain** to switch between:
   - Facebook
   - Instagram
   - Twitter/X
   - LinkedIn
   - TikTok
   - Shopee
3. Login using your account for the selected platform
4. Wait until login is successful

### 3. Export Session (Download Session)

1. After successful login, click menu **Session** → **Download Session**
2. Choose location to save the session file (`.json` format)
3. File will contain cookies and localStorage data for the current platform
4. You'll see notification "✅ session downloaded successfully!"

### 4. Load Session (Import Session)

1. Click menu **Session** → **Load Session**
2. Select the `.json` session file you saved previously
3. The application will:
   - Clear old cookies
   - Load cookies from file
   - Load localStorage data
   - Navigate to the current platform
4. You'll see notification "✅ Session loaded successfully!"

### 5. Clear Session (Logout)

1. Click menu **Session** → **Clear Session**
2. The application will remove all:
   - Cookies
   - localStorage
   - sessionStorage
   - Cache data
3. Current platform page will refresh in logged out state

### 6. Additional Tools

**Copy Current URL:**
- Click **Tools** → **Copy Current URL**
- Current page URL will be copied to clipboard

**Reload Page:**
- Click **Tools** → **Reload Page**
- Current page will be refreshed

## 📁 Menu Structure

```
Config Menu:
└── Change Domain
    ├── Facebook
    ├── Instagram
    ├── Twitter/X
    ├── LinkedIn
    ├── TikTok
    └── Shopee

Session Menu:
├── Load Session     - Import session from JSON file
├── Clear Session    - Remove all session data (logout)
└── Download Session - Export session to JSON file

Tools Menu:
├── Copy Current URL - Copy current page URL to clipboard
└── Reload Page      - Refresh current page
```

## 🔧 NPM Scripts

```bash
# Run development application
npm run start
# or
bun run start

# Build application for production
npm run package

# Create installer/distributable for all platforms
npm run make

# Platform-specific builds
npm run make:win       # Windows (.exe)
npm run make:mac       # macOS (.dmg)
npm run make:linux     # Linux (.deb, .rpm)

# Package without installer
npm run package:win    # Windows package
npm run package:mac    # macOS package  
npm run package:linux  # Linux package

# Build for all platforms at once
npm run build:all

# Lint code
npm run lint
```

## 📦 Build Outputs

After building, you'll find the distributable files in:

### macOS (.dmg)
- **Location**: `out/make/Web Session Manager.dmg`
- **Size**: ~105MB
- **Architecture**: ARM64 (Apple Silicon)

### macOS (.zip) 
- **Location**: `out/make/zip/darwin/arm64/Web Session Manager-darwin-arm64-1.0.0.zip`
- **Size**: ~105MB  
- **Use case**: Alternative distribution format

### Application Bundle
- **Location**: `out/Web Session Manager-darwin-arm64/Web Session Manager.app`
- **Use case**: Direct execution without installer

## 🏗️ Building for Windows (.exe)

To build Windows executables from macOS, you'll need:

```bash
# Install Wine (for cross-compilation)
brew install --cask wine-stable

# Build Windows version
npm run make:win
```

**Note**: Cross-platform building may require additional setup. For best results, build Windows executables on a Windows machine.

## 🚀 Running the Application

### From DMG (Recommended)
1. Download `Web Session Manager.dmg`
2. Open the DMG file
3. Drag the app to Applications folder
4. Launch from Applications

### From ZIP
1. Download and extract the ZIP file  
2. Right-click the app → Open
3. Confirm security dialog if needed

### Direct Execution
```bash
cd out/Web\ Session\ Manager-darwin-arm64/
open Web\ Session\ Manager.app
```

## 📄 Session File Format

The exported session file has JSON format like this:

```json
{
  "cookies": [
    {
      "name": "c_user", // Facebook example
      "value": "100000000000000",
      "domain": ".facebook.com",
      "path": "/",
      "secure": true,
      "httpOnly": false,
      "sameSite": "Lax"
    },
    {
      "name": "SPC_EC", // Shopee example
      "value": "example_token",
      "domain": ".shopee.co.id",
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
- Make sure you're logged into the current platform first
- Check that platform-specific cookies exist (e.g., `c_user` for Facebook, `SPC_EC` for Shopee)

### Error when Loading Session
- Make sure JSON file format is correct
- Check that session file is not corrupted
- Ensure file path is accessible
- Verify session file matches the current platform

### Application won't start
- Make sure you're using Node.js v22: `nvm use 22`
- Reinstall dependencies: `npm install` or `bun install`
- Check no Electron processes are still running

### Platform switching issues
- Use Config → Change Domain to properly switch platforms
- Clear session before switching to avoid conflicts
- Some platforms may require re-login after switching

## 🚨 Disclaimer

⚠️ **Important**: This application is created for educational and testing purposes. Usage for scraping or automation that violates any platform's Terms of Service is the user's responsibility. Use wisely and according to each platform's policies.

## 📞 Support

If you have any issues or questions, please create an issue at:
https://github.com/irosadie/web-session-manager

## 🏢 Author

**BinaryDev**
- Email: hi@binarydev.co.id
- Website: https://binarydev.co.id

## 📄 License

MIT License - see LICENSE file for full details.

---

**Made with ❤️ using Electron, TypeScript, and Vite**
**Version 1.0.0 - Multi-Platform Web Session Manager**
