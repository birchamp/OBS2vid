#import <React/RCTBridgeModule.h>
#import <AVFoundation/AVFoundation.h>

@interface ObsExporter : NSObject <RCTBridgeModule>
@end

@implementation ObsExporter

RCT_EXPORT_MODULE();

RCT_REMAP_METHOD(exportVideo,
                 exportVideoWithOptions:(NSDictionary *)options
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // Validate inputs minimally so dev builds don't crash
  NSNumber *width = options[@"width"];
  NSNumber *height = options[@"height"];
  NSArray *sections = options[@"sections"];
  if (width == nil || height == nil || sections == nil || ![sections isKindOfClass:[NSArray class]] || sections.count == 0) {
    reject(@"E_INVALID_ARGS", @"Missing width/height/sections", nil);
    return;
  }

  // TODO: Implement AVMutableComposition + AVVideoComposition with Ken Burns transforms and crossfades.
  // For now, compute duration approximation to unblock UI/dev.
  double crossfadeMs = [options[@"crossfadeMs"] ?: @(350) doubleValue];
  double total = 0;
  for (NSDictionary *sec in sections) {
    total += [sec[@"durationMs"] ?: @(0) doubleValue];
  }
  if (sections.count > 1) total -= crossfadeMs * (sections.count - 1);

  NSString *outputPath = options[@"outputPath"] ?: @"";
  resolve(@{ @"outputPath": outputPath, @"durationMs": @(total) });
}

@end

