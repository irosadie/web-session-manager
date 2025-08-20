import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { MakerDMG } from '@electron-forge/maker-dmg';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { FuseV1Options, FuseVersion } from '@electron/fuses';

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
    name: 'Facebook Session Manager',
    executableName: 'facebook-session-manager',
    appBundleId: 'com.binarydev.facebook-session-manager',
    appCategoryType: 'public.app-category.developer-tools',
    icon: './public/img/icon', // Fixed icon path
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
    new MakerSquirrel({
      name: 'facebook-session-manager',
      setupIcon: './public/img/icon.ico',
      // loadingGif: './public/img/loading.gif', // Optional
      loadingGif: './public/img/icon.ico', // Optional
    }),
    // macOS - DMG installer
    new MakerDMG({
      name: 'Facebook Session Manager',
      icon: './public/img/icon.icns',
      // background: './public/img/icon.png', // Optional - disabled for now
      format: 'ULFO'
    }),
    // macOS - ZIP file (backup)
    new MakerZIP({}, ['darwin']),
    // Linux
    new MakerRpm({
      options: {
        name: 'facebook-session-manager',
        productName: 'Facebook Session Manager',
        icon: './public/img/icon.png'
      }
    }), 
    new MakerDeb({
      options: {
        name: 'facebook-session-manager',
        productName: 'Facebook Session Manager',
        icon: './public/img/icon.png'
      }
    })
  ],
  plugins: [
    new VitePlugin({
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
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
};

export default config;
