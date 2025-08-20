import {
    app,
    BrowserWindow,
    session,
    Menu,
    MenuItemConstructorOptions,
    dialog,
    clipboard
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

// Domain configuration
interface DomainConfig {
    domain: string
    displayName: string
    url: string
    cookieIdentifiers: string[]
}

const domainConfigs: DomainConfig[] = [
    {
        domain: 'facebook.com',
        displayName: 'Facebook',
        url: 'https://www.facebook.com',
        cookieIdentifiers: ['c_user', 'xs']
    },
    {
        domain: 'instagram.com',
        displayName: 'Instagram', 
        url: 'https://www.instagram.com',
        cookieIdentifiers: ['sessionid', 'csrftoken']
    },
    {
        domain: 'twitter.com',
        displayName: 'Twitter/X',
        url: 'https://x.com',
        cookieIdentifiers: ['auth_token', 'ct0']
    },
    {
        domain: 'linkedin.com',
        displayName: 'LinkedIn',
        url: 'https://www.linkedin.com',
        cookieIdentifiers: ['li_at', 'JSESSIONID']
    },
    {
        domain: 'tiktok.com',
        displayName: 'TikTok',
        url: 'https://www.tiktok.com',
        cookieIdentifiers: ['sessionid', 'sid_tt']
    },
    {
        domain: 'shopee.co.id',
        displayName: 'Shopee',
        url: 'https://shopee.co.id',
        cookieIdentifiers: ['SPC_EC', 'SPC_F', 'shopee_token', 'SPC_SI', 'SPC_U', 'csrftoken', 'REC_T_ID', 'SPC_R_T_ID', 'SPC_T_ID', 'language', 'SPC_SC_TK']
    }
]

let currentDomainConfig = domainConfigs[0] // Default ke Facebook
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
            label: 'Config',
            submenu: [
                {
                    label: 'Change Domain',
                    submenu: domainConfigs.map(config => ({
                        label: config.displayName,
                        type: 'radio' as const,
                        checked: config.domain === currentDomainConfig.domain,
                        click: async () => {
                            await changeDomain(config)
                        }
                    }))
                }
            ]
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
        {
            label: 'Tools',
            submenu: [
                {
                    label: 'Copy Current URL',
                    click: async () => {
                        try {
                            if (!win) {
                                console.error('❌ Window not available')
                                return
                            }

                            const currentURL = win.webContents.getURL()
                            
                            if (!currentURL) {
                                console.log('❌ No URL available')
                                win.webContents.executeJavaScript(`alert("❌ No URL available")`)
                                return
                            }

                            // Copy to clipboard using Electron's clipboard API
                            clipboard.writeText(currentURL)
                            
                            console.log('✅ URL copied to clipboard:', currentURL)
                            win.webContents.executeJavaScript(`alert("✅ URL copied to clipboard:\\n${currentURL}")`)
                            
                        } catch (error) {
                            console.error('❌ Error copying URL:', error)
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                            win?.webContents.executeJavaScript(`alert("❌ Error copying URL: ${errorMessage}")`)
                        }
                    }
                },
                {
                    type: 'separator'
                },
                {
                    label: 'Reload Page',
                    click: async () => {
                        try {
                            if (!win) {
                                console.error('❌ Window not available')
                                return
                            }

                            console.log('🔄 Reloading current page...')
                            win.webContents.reload()
                            
                            console.log('✅ Page reloaded successfully')
                            
                        } catch (error) {
                            console.error('❌ Error reloading page:', error)
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                            win?.webContents.executeJavaScript(`alert("❌ Error reloading page: ${errorMessage}")`)
                        }
                    }
                }
            ]
        },
    ]

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

async function changeDomain(config: DomainConfig) {
    try {
        currentDomainConfig = config
        console.log(`🔄 Changing domain to: ${config.displayName}`)
        
        if (!win) {
            console.error('❌ Window not available')
            return
        }

        // Update window title
        win.setTitle(`${config.displayName} Session Manager - Chrome`)
        
        // Update app name in dock/taskbar
        app.setName(`${config.displayName} - Chrome`)
        
        // Navigate to new domain
        await win.loadURL(config.url, { userAgent })
        
        // Recreate menu with updated radio selection
        createAppMenu()
        
        console.log(`✅ Switched to ${config.displayName}`)
        win.webContents.executeJavaScript(`alert("✅ Switched to ${config.displayName}")`)
        
    } catch (error) {
        console.error('❌ Error changing domain:', error)
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        win?.webContents.executeJavaScript(`alert("❌ Error changing domain: ${errorMessage}")`)
    }
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

        // Navigate to current domain after loading session
        console.log(`🌐 Navigating to ${currentDomainConfig.displayName}...`)
        await win?.loadURL(currentDomainConfig.url, { userAgent })
        
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

        // Navigate to current domain to refresh the page
        await win.loadURL(currentDomainConfig.url, { userAgent })
        
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
        
        // Filter cookies for current domain
        const targetDomains = [
            currentDomainConfig.domain,
            `.${currentDomainConfig.domain}`,
            currentDomainConfig.domain.replace('www.', ''),
            `.${currentDomainConfig.domain.replace('www.', '')}`
        ]
        
        // Add special handling for Shopee subdomains
        if (currentDomainConfig.domain === 'shopee.co.id') {
            targetDomains.push('mall.shopee.co.id', 'seller.shopee.co.id', '.mall.shopee.co.id', '.seller.shopee.co.id')
        }
        
        const domainCookies = allCookies.filter(c => 
            targetDomains.some(domain => c.domain.includes(domain))
        )

        // Enhanced login detection for Shopee
        let loginCookie
        if (currentDomainConfig.domain === 'shopee.co.id') {
            // For Shopee, check for any of the primary auth cookies
            loginCookie = domainCookies.find(c => 
                ['SPC_EC', 'SPC_U', 'shopee_token', 'SPC_SI'].includes(c.name)
            )
        } else {
            // For other domains, use existing logic
            loginCookie = domainCookies.find(c => 
                currentDomainConfig.cookieIdentifiers.some(identifier => c.name === identifier)
            )
        }
        
        if (!loginCookie) {
            console.log(`⚠️ Belum login (cookies "${currentDomainConfig.cookieIdentifiers.join(', ')}" tidak ditemukan)`)
            win?.webContents.executeJavaScript(`alert("⚠️ Belum login ke ${currentDomainConfig.displayName}")`)
            return
        }

        const cookieString = domainCookies.map(c => `${c.name}=${c.value}`).join('; ')

        const storageData = await win?.webContents.executeJavaScript(`
      (() => {
        const localStorage = {};
        const sessionStorage = {};
        try {
          for (let i = 0; i < window.localStorage.length; i++) {
            const k = window.localStorage.key(i);
            if (k) localStorage[k] = window.localStorage.getItem(k);
          }
        } catch (e) {
          console.log('Error accessing localStorage:', e);
        }
        try {
          for (let i = 0; i < window.sessionStorage.length; i++) {
            const k = window.sessionStorage.key(i);
            if (k) sessionStorage[k] = window.sessionStorage.getItem(k);
          }
        } catch (e) {
          console.log('Error accessing sessionStorage:', e);
        }
        
        // Enhanced data collection for Shopee
        let shopeeSpecificData = {};
        if (window.location.hostname.includes('shopee.co.id')) {
          try {
            // Try to get user or cart data from window object
            shopeeSpecificData = {
              currentUser: window.__INITIAL_STATE__?.user || null,
              cartData: window.__CART_DATA__ || null,
              regionData: window.__REGION_DATA__ || null,
              shopeeApp: window.__SHOPEE_APP_CONFIG__ || null
            };
          } catch (e) {
            console.log('No Shopee specific data found');
          }
        }
        
        return {
          localStorage,
          sessionStorage,
          userAgent: navigator.userAgent,
          origin: window.location.origin,
          timestamp: new Date().toISOString(),
          shopeeData: shopeeSpecificData
        }
      })()
    `)

        sessionData = {
            url: currentURL,
            timestamp: new Date().toISOString(),
            userAgent: userAgent,
            cookies: domainCookies,
            cookieString,
            domains: [...new Set(domainCookies.map(c => c.domain))],
            browserContext: storageData || {},
        }

        console.log(`✅ ${currentDomainConfig.displayName} session collected successfully`)
        console.log(`📊 Collected ${domainCookies.length} cookies for ${currentDomainConfig.displayName}`)
        
        // Special logging for Shopee
        if (currentDomainConfig.domain === 'shopee.co.id') {
            const shopeeAuthCookies = domainCookies.filter(c => 
                ['SPC_EC', 'SPC_U', 'shopee_token', 'SPC_SI'].includes(c.name)
            ).map(c => c.name)
            console.log(`🛒 Shopee auth cookies found: ${shopeeAuthCookies.join(', ')}`)
        }
    } catch (e) {
        console.error('❌ Failed to collect session data:', e)
        win?.webContents.executeJavaScript(`alert("❌ Gagal collect session data")`)
    }
}

async function createWindow() {
	win = new BrowserWindow({
        width: 1200,
        height: 800,
        icon: path.join(__dirname, '../public/img/icon.png'), // Icon path sudah benar
        title: `${currentDomainConfig.displayName} Session Manager`,
        show: false, // Don't show until ready to load
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: false,
            nodeIntegration: false,
            webSecurity: true
        },
	})
	
	win.setTitle(`${currentDomainConfig.displayName} Session Manager - Chrome`)

    // Show window when ready to prevent premature closing
    win.once('ready-to-show', () => {
        win?.show()
        console.log('✅ Window ready and shown')
    })

    // Add error handling for failed loads
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        console.error('❌ Failed to load:', errorCode, errorDescription)
    })

    // Add console logging for debugging
    win.webContents.on('did-start-loading', () => {
        console.log(`🔄 Started loading ${currentDomainConfig.displayName}...`)
    })

    win.webContents.on('did-finish-load', () => {
        console.log(`✅ Page loaded. Login ${currentDomainConfig.displayName} ya!`)
    })

    // Load current domain with error handling
    try {
        await win.loadURL(currentDomainConfig.url, {
            userAgent,
        })
        console.log(`✅ ${currentDomainConfig.displayName} URL loaded successfully`)
    } catch (error) {
        console.error(`❌ Error loading ${currentDomainConfig.displayName}:`, error)
        // Show a local error page or retry
        win?.loadFile(path.join(__dirname, '../public/error.html')).catch(() => {
            console.error('❌ Could not load error page')
        })
    }

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

app.setName(`${currentDomainConfig.displayName} - Chrome`)