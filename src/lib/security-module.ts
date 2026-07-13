import { NativeModules, Platform } from 'react-native';

const { SecurityModule } = NativeModules;

/**
 * A bridge to the Java-based SecurityModule for Android.
 * This demonstrates integration with native Android code for academic/security purposes.
 */
export const encryptWithJava = async (data: string): Promise<string> => {
    if (Platform.OS !== 'android') {
        return `[Simulation] Encrypted: ${btoa(data)}`;
    }

    try {
        return await SecurityModule.encryptData(data);
    } catch (error) {
        console.error("Java Encryption Error:", error);
        return data;
    }
};

export const getDeviceSecureID = async (): Promise<string> => {
    if (Platform.OS !== 'android') {
        return "SIMULATED-DEVICE-ID";
    }

    try {
        return await SecurityModule.getDeviceSecureID();
    } catch (error) {
        console.error("Java Device ID Error:", error);
        return "UNKNOWN-ID";
    }
};
