package com.clipcapital.app;

import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.BatteryManager;
import android.os.Build;
import android.os.SystemClock;
import android.widget.Toast;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class DeviceModule extends ReactContextBaseJavaModule {
    DeviceModule(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "DeviceModule";
    }

    @ReactMethod
    public void getBatteryLevel(Promise promise) {
        try {
            IntentFilter ifilter = new IntentFilter(Intent.ACTION_BATTERY_CHANGED);
            Intent batteryStatus = getReactApplicationContext().registerReceiver(null, ifilter);
            int level = batteryStatus != null ? batteryStatus.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) : -1;
            int scale = batteryStatus != null ? batteryStatus.getIntExtra(BatteryManager.EXTRA_SCALE, -1) : -1;
            float batteryPct = level * 100 / (float)scale;
            promise.resolve((int)batteryPct);
        } catch (Exception e) {
            promise.reject("Error", "Could not get battery level: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getSystemUptime(Promise promise) {
        long uptimeMillis = SystemClock.elapsedRealtime();
        long minutes = (uptimeMillis / (1000 * 60));
        promise.resolve(minutes + " minutes");
    }

    @ReactMethod
    public void getAndroidVersion(Promise promise) {
        promise.resolve("Android " + Build.VERSION.RELEASE + " (API " + Build.VERSION.SDK_INT + ")");
    }

    @ReactMethod
    public void showNativeToast(String message) {
        Toast.makeText(getReactApplicationContext(), message, Toast.LENGTH_SHORT).show();
    }
}
