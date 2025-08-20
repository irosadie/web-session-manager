"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const maker_squirrel_1 = require("@electron-forge/maker-squirrel");
const maker_zip_1 = require("@electron-forge/maker-zip");
const maker_deb_1 = require("@electron-forge/maker-deb");
const maker_rpm_1 = require("@electron-forge/maker-rpm");
const maker_dmg_1 = require("@electron-forge/maker-dmg");
const plugin_vite_1 = require("@electron-forge/plugin-vite");
const plugin_fuses_1 = require("@electron-forge/plugin-fuses");
const fuses_1 = require("@electron/fuses");
const config = {
    packagerConfig: {
        asar: true,
        name: 'Facebook Session Manager',
        executableName: 'facebook-session-manager',
        appBundleId: 'com.binarydev.facebook-session-manager',
        appCategoryType: 'public.app-category.developer-tools',
        icon: './public/img/icon',
        // osxSign disabled for development - no code signing required
        win32metadata: {
            CompanyName: 'BinaryDev',
            FileDescription: 'Facebook Session Manager',
            OriginalFilename: 'facebook-session-manager.exe',
            ProductName: 'Facebook Session Manager',
            InternalName: 'facebook-session-manager'
        }
    },
    rebuildConfig: {},
    makers: [
        // Windows - Squirrel installer (.exe)
        new maker_squirrel_1.MakerSquirrel({
            name: 'facebook-session-manager',
            setupIcon: './public/img/icon.ico',
            // loadingGif: './public/img/loading.gif', // Optional
            loadingGif: './public/img/icon.ico', // Optional
        }),
        // macOS - DMG installer
        new maker_dmg_1.MakerDMG({
            name: 'Facebook Session Manager',
            icon: './public/img/icon.icns',
            // background: './public/img/icon.png', // Optional - disabled for now
            format: 'ULFO'
        }),
        // macOS - ZIP file (backup)
        new maker_zip_1.MakerZIP({}, ['darwin']),
        // Linux
        new maker_rpm_1.MakerRpm({
            options: {
                name: 'facebook-session-manager',
                productName: 'Facebook Session Manager',
                icon: './public/img/icon.png'
            }
        }),
        new maker_deb_1.MakerDeb({
            options: {
                name: 'facebook-session-manager',
                productName: 'Facebook Session Manager',
                icon: './public/img/icon.png'
            }
        })
    ],
    plugins: [
        new plugin_vite_1.VitePlugin({
            // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
            // If you are familiar with Vite configuration, it will look really familiar.
            build: [
                {
                    // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
                    entry: 'src/main.ts',
                    config: 'vite.main.config.ts',
                    target: 'main',
                },
                {
                    entry: 'src/preload.ts',
                    config: 'vite.preload.config.ts',
                    target: 'preload',
                },
            ],
            renderer: [
                {
                    name: 'main_window',
                    config: 'vite.renderer.config.ts',
                },
            ],
        }),
        // Fuses are used to enable/disable various Electron functionality
        // at package time, before code signing the application
        new plugin_fuses_1.FusesPlugin({
            version: fuses_1.FuseVersion.V1,
            [fuses_1.FuseV1Options.RunAsNode]: false,
            [fuses_1.FuseV1Options.EnableCookieEncryption]: true,
            [fuses_1.FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [fuses_1.FuseV1Options.EnableNodeCliInspectArguments]: false,
            [fuses_1.FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [fuses_1.FuseV1Options.OnlyLoadAppFromAsar]: true,
        }),
    ],
};
exports.default = config;
//# sourceMappingURL=forge.config.js.map