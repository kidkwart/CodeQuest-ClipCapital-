import { NativeModules, Platform } from 'react-native';

const { DeviceModule } = NativeModules;

/**
 * A bridge to the Java-based DeviceModule for Android.
 * This demonstrates integration with native Android code for academic purposes.
 */
export const getBatteryLevel = async (): Promise<number> => {
    // Academic Requirement: Use Java Native Module on Android
    if (Platform.OS === 'android') {
        try {
            return await DeviceModule.getBatteryLevel();
        } catch (error) {
            console.error("Java Battery Error:", error);
        }
    }

    // iOS / Fallback: Use standard Expo Battery API
    try {
        const Battery = require('expo-battery');
        const isBatteryAvailable = await Battery.isAvailableAsync();
        if (!isBatteryAvailable) return 100;

        const level = await Battery.getBatteryLevelAsync();
        // level is 0-1, convert to percentage. Handle -1 (unknown) case.
        if (level === -1) return 100;
        return Math.round(level * 100);
    } catch (e) {
        console.error("Expo Battery Error:", e);
        return 100; // Default for iOS simulators
    }
};

export const getSystemUptime = async (): Promise<string> => {
    if (Platform.OS === 'android') {
        try {
            return await DeviceModule.getSystemUptime();
        } catch (error) {
            console.error("Java Uptime Error:", error);
        }
    }

    // For iOS, we don't have a direct uptime API in managed expo
    // Returning a realistic static value or mock
    return "Protocol Active";
};

export const getAndroidVersion = async (): Promise<string> => {
    if (Platform.OS === 'android') {
        try {
            return await DeviceModule.getAndroidVersion();
        } catch (error) {
            console.error("Java OS Error:", error);
        }
    }

    // Use real Device info for iOS
    try {
        const Device = require('expo-device');
        return `${Device.osName} ${Device.osVersion}`;
    } catch (e) {
        return `${Platform.OS} ${Platform.Version}`;
    }
};

export const showNativeToast = (message: string): void => {
    if (Platform.OS === 'android') {
        try {
            DeviceModule.showNativeToast(message);
            return;
        } catch (e) {
            console.error("Java Toast Error:", e);
        }
    }

    // iOS Fallback: Using console log as toasts are non-native on iOS
    // In a real app we might use a library like react-native-root-toast
    console.log("Institutional Signal:", message);
};
