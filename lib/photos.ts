import { Platform } from 'react-native';
import { type ImagePickerAsset } from 'expo-image-picker';

/**
 * PRD 6-6 인증 사진 저장.
 *
 * expo-image-picker가 돌려주는 uri는 플랫폼별로 수명이 다르다:
 * - 네이티브: 캐시 경로(file://...) — OS가 저장공간 부족 시 정리할 수 있어 "지난 기록"이
 *   나중에 깨질 수 있다. 그래서 앱 문서 디렉토리로 복사해 영구 보관한다.
 * - 웹: URL.createObjectURL()로 만든 blob: URI — 새로고침하면 무효화된다. base64로 받아
 *   data: URI로 변환해 SQLite(WASM) 컬럼에 그대로 저장한다.
 */

const PHOTOS_DIR_NAME = 'habit-photos';

function extensionFromAsset(asset: ImagePickerAsset): string {
  const mime = asset.mimeType;
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  const match = asset.uri.match(/\.(\w+)(?:\?.*)?$/);
  return match ? match[1] : 'jpg';
}

export async function persistPickedAsset(
  asset: ImagePickerAsset,
  opts: { habitId: number; dateKey: string }
): Promise<string> {
  if (Platform.OS === 'web') {
    if (!asset.base64) {
      throw new Error('웹에서는 base64 데이터가 필요해요');
    }
    const mime = asset.mimeType ?? 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }

  const { Directory, File, Paths } = await import('expo-file-system');
  const photosDir = new Directory(Paths.document, PHOTOS_DIR_NAME);
  if (!photosDir.exists) {
    photosDir.create({ intermediates: true, idempotent: true });
  }

  const fileName = `${opts.habitId}-${opts.dateKey}-${Date.now()}.${extensionFromAsset(asset)}`;
  const destination = new File(photosDir, fileName);
  const source = new File(asset.uri);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

/** 사진 교체/삭제 시 이전에 영구 보관된 로컬 파일을 정리한다. 웹 data: URI는 그냥 무시. */
export async function deleteLocalPhoto(uri: string | null | undefined): Promise<void> {
  if (!uri || Platform.OS === 'web') return;
  if (!uri.startsWith('file://')) return;

  try {
    const { File, Paths } = await import('expo-file-system');
    if (!uri.includes(`/${PHOTOS_DIR_NAME}/`) && !uri.startsWith(Paths.document.uri)) return;
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // 이미 지워졌거나 접근 불가한 경우는 무시 — orphan 파일 정리는 best-effort.
  }
}
