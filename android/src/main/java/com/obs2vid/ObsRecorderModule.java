package com.obs2vid;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;

import androidx.annotation.NonNull;
import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

public class ObsRecorderModule extends ReactContextBaseJavaModule implements PermissionListener {
  private Promise permissionPromise;
  private static final int REQ_CODE = 9342;
  public ObsRecorderModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "ObsRecorder";
  }

  @ReactMethod
  public void requestPermission(Promise promise) {
    ReactApplicationContext ctx = getReactApplicationContext();
    int state = ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO);
    if (state == PackageManager.PERMISSION_GRANTED) {
      promise.resolve(true);
      return;
    }
    Activity activity = getCurrentActivity();
    if (activity instanceof PermissionAwareActivity) {
      this.permissionPromise = promise;
      ((PermissionAwareActivity) activity).requestPermissions(new String[]{ Manifest.permission.RECORD_AUDIO }, REQ_CODE, this);
    } else {
      // Cannot prompt; report not granted
      promise.resolve(false);
    }
  }

  @ReactMethod
  public void hasPermission(Promise promise) {
    ReactApplicationContext ctx = getReactApplicationContext();
    int state = ContextCompat.checkSelfPermission(ctx, Manifest.permission.RECORD_AUDIO);
    promise.resolve(state == PackageManager.PERMISSION_GRANTED);
  }

  @ReactMethod
  public void canRecord(Promise promise) {
    // Basic check: if we can query audio permission, assume device has mic on emulator
    promise.resolve(true);
  }

  @ReactMethod
  public void start(String path, com.facebook.react.bridge.ReadableMap opts, Promise promise) {
    // TODO: Configure and start MediaRecorder to given path
    promise.resolve(null);
  }

  @ReactMethod
  public void stop(Promise promise) {
    // TODO: Stop MediaRecorder and return duration
    WritableMap map = Arguments.createMap();
    map.putString("path", "");
    map.putInt("durationMs", 1000);
    promise.resolve(map);
  }

  @ReactMethod
  public void play(String path, Promise promise) {
    // TODO: Start playback via MediaPlayer/ExoPlayer
    promise.resolve(null);
  }

  @ReactMethod
  public void stopPlay(Promise promise) {
    // TODO: Stop playback
    promise.resolve(null);
  }

  @ReactMethod
  public void remove(String path, Promise promise) {
    // TODO: Delete file at path
    promise.resolve(null);
  }

  @ReactMethod
  public void getMetering(Promise promise) {
    // TODO: Return metering if supported
    promise.resolve(-60);
  }

  @ReactMethod
  public void resolvePath(String relative, Promise promise) {
    java.io.File dir = new java.io.File(getReactApplicationContext().getFilesDir(), relative);
    promise.resolve(dir.getAbsolutePath());
  }

  @Override
  public boolean onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
    if (requestCode == REQ_CODE && permissionPromise != null) {
      boolean granted = grantResults != null && grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
      permissionPromise.resolve(granted);
      permissionPromise = null;
      return true;
    }
    return false;
  }
}
