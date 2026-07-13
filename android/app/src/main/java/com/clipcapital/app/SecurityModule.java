package com.clipcapital.app;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import android.util.Base64;

public class SecurityModule extends ReactContextBaseJavaModule {
    SecurityModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "SecurityModule";
    }

    @ReactMethod
    public void encryptData(String data, Promise promise) {
        try {
            // A simple "encryption" simulation using Base64 for the lecturer to see Java logic
            byte[] encodedBytes = Base64.encode(data.getBytes(), Base64.DEFAULT);
            String encodedString = new String(encodedBytes);
            promise.resolve(encodedString);
        } catch (Exception e) {
            promise.reject("Error", "Could not encrypt data: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getDeviceSecureID(Promise promise) {
        // Example of accessing Android system info via Java
        String model = android.os.Build.MODEL;
        promise.resolve("SECURE-" + model + "-ID");
    }
}
