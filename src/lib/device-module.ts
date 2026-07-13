import { NativeModules, Platform } from 'react-native';

const { DeviceModule } = NativeModules;

/**
 * A bridge to the Java-based DeviceModule for Android.
 * This demonstrates integration with native Android code for academic purposes.
 */
export const getBatteryLevel = async (): Promise<number> => {
    if (Platform.OS !== 'android') return 100;
    try {
        return await DeviceModule.getBatteryLevel();
    } catch (error) {
        console.error("Java Battery Error:", error);
        return -1;
    }
};

export const getSystemUptime = async (): Promise<string> => {
    if (Platform.OS !== 'android') return "120 minutes";
    try {
        return await DeviceModule.getSystemUptime();
    } catch (error) {
        console.error("Java Uptime Error:", error);
        return "Unknown";
    }
};

export const getAndroidVersion = async (): Promise<string> => {
    if (Platform.OS !== 'android') return "Android 14 (Simulated)";
    try {
        return await DeviceModule.getAndroidVersion();
    } catch (error) {
        console.error("Java OS Error:", error);
        return "Unknown";
    }
};

export const showNativeToast = (message: string): void => {
    if (Platform.OS !== 'android') {
        console.log("Toast [Simulation]:", message);
        return;
    }
    DeviceModule.showNativeToast(message);
};
