/**
 * ============================================================
 *  CAMERA SERVICE
 *
 *  Handles video recording, photo capture, and frame extraction
 *  for Gemini Vision analysis.
 *
 *  FOR FUTURE AGENTS:
 *  - extractFrames() gives you base64 images ready for Gemini
 *  - Call agentService.analyzeVideoFrames() with the result
 *  - Frame count is configurable — more frames = better analysis
 *    but larger payload. 6-10 frames works well for technique.
 * ============================================================
 */

import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { FEATURES } from '../config/features';

export interface VideoFrame {
  base64: string;
  mimeType: string;
  timestamp: number; // ms into the video
}

export interface CapturedMedia {
  uri: string;
  type: 'video' | 'image';
  duration?: number; // ms, for video
  width?: number;
  height?: number;
}

class CameraService {

  /**
   * Request camera and media library permissions.
   * Call once on app start or before first camera use.
   */
  async requestPermissions(): Promise<boolean> {
    if (!FEATURES.camera) return false;

    const camera = await ImagePicker.requestCameraPermissionsAsync();
    const media = FEATURES.mediaLibrary
      ? await ImagePicker.requestMediaLibraryPermissionsAsync()
      : { granted: true };

    return camera.granted && media.granted;
  }

  /**
   * Launch camera to record a video.
   * Returns the video URI or null if cancelled.
   */
  async recordVideo(maxDurationSeconds = 60): Promise<CapturedMedia | null> {
    if (!FEATURES.camera) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      videoMaxDuration: maxDurationSeconds,
      quality: ImagePicker.UIImagePickerControllerQualityType.Medium,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: 'video',
      duration: asset.duration ? asset.duration * 1000 : undefined,
      width: asset.width,
      height: asset.height,
    };
  }

  /**
   * Take a photo with the camera.
   */
  async takePhoto(): Promise<CapturedMedia | null> {
    if (!FEATURES.camera) return null;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: 'image',
      width: asset.width,
      height: asset.height,
    };
  }

  /**
   * Pick a video or photo from the device gallery.
   */
  async pickFromGallery(type: 'video' | 'image' | 'both' = 'both'): Promise<CapturedMedia | null> {
    if (!FEATURES.mediaLibrary) return null;

    const mediaTypes =
      type === 'video' ? ImagePicker.MediaTypeOptions.Videos
      : type === 'image' ? ImagePicker.MediaTypeOptions.Images
      : ImagePicker.MediaTypeOptions.All;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes,
      quality: 0.8,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      type: asset.type === 'video' ? 'video' : 'image',
      duration: asset.duration ? asset.duration * 1000 : undefined,
      width: asset.width,
      height: asset.height,
    };
  }

  /**
   * Convert an image URI to base64 for Gemini Vision.
   */
  async imageUriToBase64(uri: string): Promise<string> {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  }

  /**
   * Extract evenly-spaced frames from a video for Gemini analysis.
   *
   * NOTE: Full video frame extraction requires expo-video-thumbnails.
   * Install: npx expo install expo-video-thumbnails
   *
   * This method uses it if available, otherwise returns a
   * helpful message so the agent can inform the user.
   *
   * @param videoUri   Local video URI
   * @param frameCount Number of frames to extract (6-10 recommended)
   * @param duration   Video duration in ms (if known)
   */
  async extractFrames(
    videoUri: string,
    frameCount = 8,
    duration?: number,
  ): Promise<VideoFrame[]> {
    if (!FEATURES.videoFrameExtraction) return [];

    try {
      // Dynamic import — only fails if expo-video-thumbnails not installed
      const { VideoThumbnails } = await import('expo-video-thumbnails');

      const videoDuration = duration ?? 30000; // fallback 30s
      const frames: VideoFrame[] = [];
      const interval = videoDuration / (frameCount + 1);

      for (let i = 1; i <= frameCount; i++) {
        const timeMs = Math.floor(interval * i);
        try {
          const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
            time: timeMs,
            quality: 0.7,
          });
          const base64 = await this.imageUriToBase64(uri);
          frames.push({ base64, mimeType: 'image/jpeg', timestamp: timeMs });
        } catch {
          // Skip frames that fail — partial analysis still valuable
        }
      }

      return frames;
    } catch {
      console.warn(
        '[CameraService] expo-video-thumbnails not installed.\n' +
        'Run: npx expo install expo-video-thumbnails\n' +
        'Then rebuild with: npx expo run:ios / run:android'
      );
      return [];
    }
  }
}

export const cameraService = new CameraService();
