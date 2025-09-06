package com.obs2vid;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;

public class ObsExporterModule extends ReactContextBaseJavaModule {
  public ObsExporterModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @NonNull
  @Override
  public String getName() {
    return "ObsExporter";
  }

  @ReactMethod
  public void exportVideo(ReadableMap options, Promise promise) {
    try {
      if (options == null) {
        promise.reject("E_INVALID_ARGS", "Missing options");
        return;
      }
      if (!options.hasKey("width") || !options.hasKey("height") || !options.hasKey("sections")) {
        promise.reject("E_INVALID_ARGS", "Missing width/height/sections");
        return;
      }
      ReadableArray sections = options.getArray("sections");
      if (sections == null || sections.size() == 0) {
        promise.reject("E_INVALID_ARGS", "sections must be non-empty");
        return;
      }
      double crossfadeMs = options.hasKey("crossfadeMs") ? options.getDouble("crossfadeMs") : 350.0;
      double total = 0.0;
      for (int i = 0; i < sections.size(); i++) {
        ReadableMap sec = sections.getMap(i);
        if (sec != null && sec.hasKey("durationMs")) {
          total += sec.getDouble("durationMs");
        }
      }
      if (sections.size() > 1) total -= crossfadeMs * (sections.size() - 1);
      String outputPath = options.hasKey("outputPath") ? options.getString("outputPath") : "";
      WritableMap result = Arguments.createMap();
      result.putString("outputPath", outputPath);
      result.putDouble("durationMs", total);
      promise.resolve(result);
    } catch (Exception e) {
      promise.reject("E_EXPORT", e);
    }
  }
}

