#import <React/RCTBridgeModule.h>
#import <React/RCTLog.h>
#import <AVFoundation/AVFoundation.h>

@interface RCT_EXTERN_MODULE(ObsRecorder, NSObject)
@end

@interface ObsRecorder : NSObject <RCTBridgeModule>
@end

@implementation ObsRecorder

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(requestPermission,
                 requestPermissionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  if (@available(iOS 13.0, *)) {
    [session requestRecordPermission:^(BOOL granted) {
      resolve(@(granted));
    }];
  } else {
    [session requestRecordPermission:^(BOOL granted) {
      resolve(@(granted));
    }];
  }
}

RCT_REMAP_METHOD(hasPermission,
                 hasPermissionWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
#if __IPHONE_OS_VERSION_MAX_ALLOWED >= 130000
  AVAudioSessionRecordPermission perm = [session recordPermission];
  BOOL granted = (perm == AVAudioSessionRecordPermissionGranted);
  resolve(@(granted));
#else
  resolve(@(YES));
#endif
}

RCT_REMAP_METHOD(canRecord,
                 canRecordWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  AVAudioSession *session = [AVAudioSession sharedInstance];
  resolve(@(session.isInputAvailable));
}

RCT_REMAP_METHOD(start,
                 startWithPath:(NSString *)path
                 opts:(NSDictionary *)opts
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // Configure AVAudioSession for recording; actual recording is a TODO.
  NSError *error = nil;
  AVAudioSession *session = [AVAudioSession sharedInstance];
  AVAudioSessionCategoryOptions options = AVAudioSessionCategoryOptionDefaultToSpeaker | AVAudioSessionCategoryOptionAllowBluetooth;
  BOOL ok = [session setCategory:AVAudioSessionCategoryPlayAndRecord withOptions:options error:&error];
  if (!ok) {
    reject(@"E_SESSION_CATEGORY", error.localizedDescription, error);
    return;
  }
  ok = [session setActive:YES error:&error];
  if (!ok) {
    reject(@"E_SESSION_ACTIVE", error.localizedDescription, error);
    return;
  }
  resolve(nil);
}

RCT_REMAP_METHOD(stop,
                 stopWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // TODO: stop recorder and compute duration
  resolve(@{ @"path": @"", @"durationMs": @(1000) });
}

RCT_REMAP_METHOD(play,
                 playWithPath:(NSString *)path
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // TODO: play audio file at path
  resolve(nil);
}

RCT_REMAP_METHOD(stopPlay,
                 stopPlayWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // TODO: stop playback if any
  resolve(nil);
}

RCT_REMAP_METHOD(remove,
                 removeWithPath:(NSString *)path
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // TODO: remove file at path
  resolve(nil);
}

RCT_REMAP_METHOD(getMetering,
                 getMeteringWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // TODO: return recorder averagePowerForChannel if available
  resolve(@(-60));
}

RCT_REMAP_METHOD(resolvePath,
                 resolvePathWithRelative:(NSString *)relative
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // Resolve to Documents/relative
  NSArray<NSURL *> *dirs = [[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask];
  NSURL *doc = dirs.firstObject;
  NSString *abs = [[doc URLByAppendingPathComponent:relative] path];
  resolve(abs);
}

@end
