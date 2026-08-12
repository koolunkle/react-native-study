// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite 웹 백엔드(wa-sqlite)가 .wasm 파일을 정적 에셋으로 요구한다.
config.resolver.assetExts.push('wasm');

// wa-sqlite가 쓰는 SharedArrayBuffer는 cross-origin isolation이 필요하다.
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    return middleware(req, res, next);
  };
};

module.exports = config;
