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
    if (Platform.OS === 'android') {
        try {
            return await SecurityModule.getDeviceSecureID();
        } catch (error) {
            console.error("Java Device ID Error:", error);
            return "UNKNOWN-ID";
        }
    }

    // iOS Implementation: Use a persistent vendor ID
    try {
        const Application = require('expo-application');
        const id = await Application.getIosIdForVendorAsync();
        return id || "IOS-SECURE-VAULT-ID";
    } catch (e) {
        return "IOS-INSTITUTIONAL-ID";
    }
};
