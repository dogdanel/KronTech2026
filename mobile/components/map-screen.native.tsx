import { NativeModules } from 'react-native';
import MapWebView from './map-webview';

export default function MapScreen() {
  if (NativeModules.RNMBXModule) {
    const MapNative = require('./map-native').default;
    return <MapNative />;
  }
  return <MapWebView />;
}
