import {
    app,
    BrowserWindow,
    session,
    Menu,
    MenuItemConstructorOptions,
    dialog
} from 'electron'
import path from 'path'
import fs from 'fs'

interface SessionData {
    url?: string
    timestamp?: string
    userAgent?: string
    cookies?: unknown[]
    cookieString?: string
    domains?: string[]
    browserContext?: {
        localStorage?: Record<string, string>
        sessionStorage?: Record<string, string>
        userAgent?: string
        origin?: string
        timestamp?: string
    }
}

interface LoadSessionData {
    cookies?: Array<{
        name: string
        value: string
        domain: string
        path?: string
        secure?: boolean
        httpOnly?: boolean
        expirationDate?: number
        sameSite?: string
    }>
    origins?: Array<{
        origin: string
        localStorage?: Array<{
            name: string
            value: string
        }>
    }>
}

const userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

let win: BrowserWindow | null = null
let sessionData: SessionData = {}
function createAppMenu() {
    const template: MenuItemConstructorOptions[] = [{
            label: 'File',
            submenu: [{
                role: 'quit' as const
            }],
        },
        {
            label: 'Edit',
            submenu: [{
                    role: 'copy' as const
                },
                {
                    role: 'paste' as const
                },
                {
                    role: 'selectAll' as const
                },
            ],
        },
        {
            label: 'View',
            submenu: [{
                    role: 'reload' as const
                },
                {
                    role: 'forceReload' as const
                },
                {
                    role: 'toggleDevTools' as const
                },
                {
                    type: 'separator'
                },
                {
                    role: 'resetZoom' as const
                },
                {
                    role: 'zoomIn' as const
                },
                {
                    role: 'zoomOut' as const
                },
                {
                    type: 'separator'
                },
                {
                    role: 'togglefullscreen' as const
                },
            ],
        },
        {
            label: 'Window',
            submenu: [{
                    role: 'minimize' as const
                },
                {
                    role: 'close' as const
                },
            ],
        },
        {
            label: 'Session',
			submenu: [
				{
					label: 'Load Session',
					click: async () => { 
						await loadSession()
					}
				},
				{
					label: 'Clear Session',
					click: async () => { 
						await clearSession()
					}
				},
				{
                label: 'Download Session',
                click: async () => {
                    try {

                        await collectSessionData()
                        if (!sessionData.cookies || sessionData.cookies.length === 0) {
                            console.log('❌ No session data to download')
                            win?.webContents.executeJavaScript(`alert("❌ Session belum tersedia")`)
                            return
                        }

                        if (!win) {
                            console.error('❌ Window not available')
                            return
                        }

                        const result = await dialog.showSaveDialog(win, {
                            title: 'Save Session',
                            defaultPath: 'session.json',
                            filters: [{
                                    name: 'JSON Files',
                                    extensions: ['json']
                                },
                                {
                                    name: 'All Files',
                                    extensions: ['*']
                                },
                            ],
                        })

                        if (!result.canceled && result.filePath) {
                            const playwrightFormat = {
                                cookies: sessionData.cookies.map(c => {
                                    const cookie = c as Record<string, unknown>;
                                    return {
                                        ...(c as unknown as Record<string, string>),
                                        sameSite: cookie.sameSite === 'lax' ? 'Lax' : 'None',
                                    }
                                }),
                                origins: [{
                                    origin: new URL(sessionData.url).origin,
                                    localStorage: Object.entries(sessionData.browserContext?.localStorage || {}).map(
                                        ([name, value]) => ({
                                            name,
                                            value
                                        })
                                    ),
                                }, ],
                            }

                            fs.writeFileSync(result.filePath, JSON.stringify(playwrightFormat, null, 2), 'utf8')
                            console.log('✅ Playwright session saved to:', result.filePath)
                            win?.webContents.executeJavaScript(`alert("✅ session downloaded successfully!")`)
                        }
                    } catch (error) {
                        console.error('❌ Error saving session:', error)
                    }
                },
            }, ],
        },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

async function loadSession() {
    try {
        if (!win) {
            console.error('❌ Window not available')
            return
        }

        const result = await dialog.showOpenDialog(win, {
            title: 'Load Session File',
            filters: [
                {
                    name: 'JSON Files',
                    extensions: ['json']
                },
                {
                    name: 'All Files', 
                    extensions: ['*']
                }
            ],
            properties: ['openFile']
        })

        if (result.canceled || !result.filePaths.length) {
            return
        }

        const sessionFilePath = result.filePaths[0]
        const sessionContent = fs.readFileSync(sessionFilePath, 'utf8')
        const sessionData: LoadSessionData = JSON.parse(sessionContent)

        console.log('📂 Loading session from:', sessionFilePath)

        // Clear existing cookies first
        const allCookies = await session.defaultSession.cookies.get({})
        for (const cookie of allCookies) {
            await session.defaultSession.cookies.remove(`http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`, cookie.name)
        }

        // Load cookies
        if (sessionData.cookies && Array.isArray(sessionData.cookies)) {
            console.log(`🍪 Loading ${sessionData.cookies.length} cookies...`)
            let cookiesLoaded = 0
            
            for (const cookie of sessionData.cookies) {
                try {
                    await session.defaultSession.cookies.set({
                        url: `https://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}`,
                        name: cookie.name,
                        value: cookie.value,
                        domain: cookie.domain,
                        path: cookie.path || '/',
                        secure: cookie.secure || false,
                        httpOnly: cookie.httpOnly || false,
                        expirationDate: cookie.expirationDate || undefined,
                        sameSite: cookie.sameSite === 'Lax' ? 'lax' : cookie.sameSite === 'Strict' ? 'strict' : 'no_restriction'
                    })
                    cookiesLoaded++
                } catch (cookieError) {
                    console.log('⚠️ Error setting cookie:', cookie.name, cookieError)
                }
            }
            console.log(`✅ Successfully loaded ${cookiesLoaded}/${sessionData.cookies.length} cookies`)
        }

        // Load localStorage and sessionStorage if available
        if (sessionData.origins && Array.isArray(sessionData.origins)) {
            for (const origin of sessionData.origins) {
                if (origin.localStorage && Array.isArray(origin.localStorage)) {
                    // Navigate to the origin first to set localStorage
                    await win?.loadURL(origin.origin, { userAgent })
                    
                    // Wait for page to load
                    await new Promise(resolve => {
                        const listener = () => {
                            win?.webContents.removeListener('did-finish-load', listener)
                            resolve(undefined)
                        }
                        win?.webContents.once('did-finish-load', listener)
                    })
                    
                    // Set localStorage items one by one
                    for (const item of origin.localStorage) {
                        try {
                            await win?.webContents.executeJavaScript(
                                `localStorage.setItem(${JSON.stringify(item.name)}, ${JSON.stringify(item.value)});`
                            )
                        } catch (error) {
                            console.log('⚠️ Error setting localStorage item:', item.name, error)
                        }
                    }
                }
            }
        }

        // Wait a bit for all session data to be properly set
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Navigate to Facebook after loading session
        console.log('🌐 Navigating to Facebook...')
        await win?.loadURL('https://www.facebook.com', { userAgent })
        
        console.log('✅ Session loaded successfully')
        win?.webContents.executeJavaScript(`alert("✅ Session loaded successfully!")`)
        
    } catch (error) {
        console.error('❌ Error loading session:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        win?.webContents.executeJavaScript(`alert("❌ Error loading session: ${errorMessage}")`)
    }
}

async function clearSession() {
    try {
        if (!win) {
            console.error('❌ Window not available')
            return
        }

        // Clear all cookies
        const allCookies = await session.defaultSession.cookies.get({})
        for (const cookie of allCookies) {
            await session.defaultSession.cookies.remove(`http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`, cookie.name)
        }

        // Clear localStorage and sessionStorage
        await win.webContents.executeJavaScript(`
            try {
                localStorage.clear();
                sessionStorage.clear();
                console.log('✅ Local storage cleared');
            } catch (error) {
                console.log('⚠️ Error clearing storage:', error);
            }
        `)

        // Clear cache and other data
        await session.defaultSession.clearStorageData({
            storages: ['localstorage', 'cookies', 'filesystem', 'indexdb', 'websql', 'cachestorage', 'serviceworkers']
        })

        // Navigate to Facebook to refresh the page
        await win.loadURL('https://www.facebook.com', { userAgent })
        
        console.log('✅ All session data cleared')
        win.webContents.executeJavaScript(`alert("✅ Session cleared successfully!")`)
        
    } catch (error) {
        console.error('❌ Error clearing session:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        win?.webContents.executeJavaScript(`alert("❌ Error clearing session: ${errorMessage}")`)
    }
}

async function collectSessionData() {
    try {
        const currentURL = win?.webContents.getURL()
        const allCookies = await session.defaultSession.cookies.get({})
        const fbCookies = allCookies.filter(c => ['facebook.com', '.facebook.com', 'fb.com', '.fb.com'].some(domain => c.domain.includes(domain)))

        const cUser = fbCookies.find(c => c.name === 'c_user')
        if (!cUser) {
            console.log('⚠️ Belum login (cookie "c_user" tidak ditemukan)')
            win?.webContents.executeJavaScript(`alert("⚠️ Belum login ke Facebook")`)
            return
        }

        const cookieString = fbCookies.map(c => `${c.name}=${c.value}`).join('; ')

        const storageData = await win?.webContents.executeJavaScript(`
      (() => {
        const localStorage = {};
        const sessionStorage = {};
        try {
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            localStorage[k] = window.localStorage.getItem(k);
          }
        } catch {}
        try {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const k = window.sessionStorage.key(i);
            sessionStorage[k] = window.sessionStorage.getItem(k);
          }
        } catch {}
        return {
          localStorage,
          sessionStorage,
          userAgent: navigator.userAgent,
          origin: window.location.origin,
          timestamp: new Date().toISOString()
        }
      })()
    `)

        sessionData = {
            url: currentURL,
            timestamp: new Date().toISOString(),
            userAgent: userAgent,
            cookies: fbCookies,
            cookieString,
            domains: [...new Set(fbCookies.map(c => c.domain))],
            browserContext: storageData || {},
        }

        console.log('✅ Session collected successfully')
    } catch (e) {
        console.error('❌ Failed to collect session data:', e)
        win?.webContents.executeJavaScript(`alert("❌ Gagal collect session data")`)
    }
}

async function createWindow() {
	win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: false,
        },
	})
	
	win.setTitle('Facebook - Chrome')

    await win.loadURL('https://www.facebook.com', {
        userAgent,
    })

    win.webContents.on('did-finish-load', () => {
        console.log('✅ Page loaded. Login Facebook ya!')
    })

    win.webContents.on('devtools-opened', () => {
        win?.webContents.closeDevTools()
    })
}

app.whenReady().then(() => {
    createAppMenu()
    createWindow()
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

app.setName('Facebook - Chrome')