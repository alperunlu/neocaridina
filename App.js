import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as Haptics from 'expo-haptics';
import gameHtml from './game-html';
import { storageBridge, SAVE_KEY, KEY_PREFIX } from './nativeBridge';

SplashScreen.preventAutoHideAsync().catch(() => {});

const BAK_KEY = 'neokarides_v1_bak'; // dönen yedek: en fazla dakikada bir yazılır
const BAD_KEY = 'neokarides_v1_bad'; // okunamayan kayıt buraya kenara alınır
const BAK_EVERY_MS = 60 * 1000;
const SPLASH_FALLBACK_MS = 4000;

const HAPTICS = {
  tap: () => Haptics.selectionAsync(),
  coin: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  good: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  bad: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  soft: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
};

export default function App() {
  const [ready, setReady] = useState(false); // depodan okuma bitti mi
  const [gen, setGen] = useState(0); // WebView'i yeniden kurmak için key
  const web = useRef(null);
  const saveRef = useRef(null); // en son kayıt (onMessage ile güncellenir)
  const kvRef = useRef({}); // oyunun diğer anahtarları (dil vb.), en son hâlleriyle
  const bakRef = useRef(null);
  const bakAt = useRef(0);
  const splashHidden = useRef(false);

  const hideSplash = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    // Oyunun yazdığı tüm 'neokarides' anahtarlarını oku (kayıt, dil, okunamayan kayıt...).
    AsyncStorage.getAllKeys()
      .then((keys) => AsyncStorage.multiGet(keys.filter((k) => k.startsWith(KEY_PREFIX))))
      .catch(() => [])
      .then((rows) => {
        const m = Object.fromEntries((rows || []).filter(([, v]) => v != null));
        saveRef.current = m[SAVE_KEY] ?? null;
        bakRef.current = m[BAK_KEY] ?? null;
        delete m[SAVE_KEY];
        delete m[BAK_KEY];
        kvRef.current = m;
        setReady(true);
      });
    const t = setTimeout(hideSplash, SPLASH_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [hideSplash]);

  const inject = (js) => web.current?.injectJavaScript(`try{${js}}catch(e){};true;`);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') inject('window.__nc&&window.__nc.resume()');
      else inject('window.__nc&&(window.__nc.save(),window.__nc.pause())');
    });
    return () => sub.remove();
  }, []);

  const remount = useCallback(() => setGen((g) => g + 1), []);

  const onMessage = (e) => {
    let m;
    try {
      m = JSON.parse(e.nativeEvent.data);
    } catch (_) {
      return;
    }
    switch (m && m.t) {
      case 'set': {
        const prev = saveRef.current;
        const now = Date.now();
        if (prev && prev !== m.v && now - bakAt.current >= BAK_EVERY_MS) {
          bakAt.current = now;
          bakRef.current = prev;
          AsyncStorage.setItem(BAK_KEY, prev).catch(() => {});
        }
        saveRef.current = m.v;
        AsyncStorage.setItem(SAVE_KEY, m.v).catch(() => {});
        break;
      }
      case 'rm':
        saveRef.current = null;
        AsyncStorage.removeItem(SAVE_KEY).catch(() => {});
        break;
      case 'kv':
        if (typeof m.k === 'string' && m.k.startsWith(KEY_PREFIX) && m.k !== BAK_KEY && typeof m.v === 'string') {
          kvRef.current[m.k] = m.v;
          AsyncStorage.setItem(m.k, m.v).catch(() => {});
        }
        break;
      case 'kvrm':
        if (typeof m.k === 'string' && m.k.startsWith(KEY_PREFIX) && m.k !== BAK_KEY) {
          delete kvRef.current[m.k];
          AsyncStorage.removeItem(m.k).catch(() => {});
        }
        break;
      case 'bad':
        // Okunamayan kayıt yedeğe dönmesin: bir sonraki 'set' onu BAK_KEY'e yazmasın.
        saveRef.current = null;
        if (typeof m.v === 'string') AsyncStorage.setItem(BAD_KEY, m.v).catch(() => {});
        break;
      case 'ready':
        hideSplash();
        break;
      case 'reload':
        remount();
        break;
      case 'hap': {
        const f = HAPTICS[m.k];
        if (f) f().catch(() => {});
        break;
      }
      default:
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" hidden />
      {ready && (
        <WebView
          key={gen}
          ref={web}
          style={styles.web}
          originWhitelist={['about:*']}
          source={{ html: gameHtml }}
          injectedJavaScriptBeforeContentLoaded={storageBridge(
            { ...kvRef.current, ...(saveRef.current != null ? { [SAVE_KEY]: saveRef.current } : {}) },
            bakRef.current
          )}
          onMessage={onMessage}
          onContentProcessDidTerminate={remount}
          onRenderProcessGone={remount}
          javaScriptEnabled
          domStorageEnabled
          bounces={false}
          scrollEnabled={false}
          overScrollMode="never"
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          textInteractionEnabled={false}
          dataDetectorTypes="none"
          webviewDebuggingEnabled={__DEV__}
          setSupportMultipleWindows={false}
          onShouldStartLoadWithRequest={(req) => req.url === 'about:blank' || req.url.startsWith('about:')}
          allowsLinkPreview={false}
          hideKeyboardAccessoryView
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#5b4029' },
  web: { flex: 1, backgroundColor: '#5b4029' },
});
