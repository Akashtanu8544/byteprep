/**
 * BytePrep Export Package Service
 * Generates bundled ZIP archives and standalone file exports for all social and media assets.
 */

import JSZip from 'jszip';
import { GeneratedContentPack } from '../types';

export class ExportService {
  /**
   * Bundles all text copy, metadata, and optional media blobs into a single zip archive
   */
  public static async createContentPackZip(
    pack: GeneratedContentPack,
    mediaFiles?: {
      videoBlob?: Blob;
      thumbnailDataUrl?: string;
      flashcardDataUrl?: string;
      squarePostDataUrl?: string;
    }
  ): Promise<Blob> {
    const zip = new JSZip();
    const folderName = `BytePrep_${pack.question.subject.replace(/[^a-zA-Z0-9]/g, '_')}_${pack.id.slice(-6)}`;
    const folder = zip.folder(folderName) || zip;

    // 1. YouTube Copy
    folder.file('youtube-title.txt', pack.youtubeTitle);
    folder.file('youtube-description.txt', pack.youtubeDescription);

    // 2. Instagram Copy
    folder.file('instagram-caption.txt', pack.reelsCaption);

    // 3. Telegram & WhatsApp Copy
    folder.file('telegram-post.txt', pack.telegramPostText);
    folder.file('whatsapp-broadcast.txt', pack.whatsappBroadcastText);

    // 4. Hashtags
    folder.file('hashtags.txt', pack.hashtags.join(' '));

    // 5. Rich JSON Metadata
    folder.file('metadata.json', JSON.stringify(pack, null, 2));

    // 6. Media Files if available
    if (mediaFiles?.videoBlob) {
      folder.file('short-video.webm', mediaFiles.videoBlob);
    }

    if (mediaFiles?.thumbnailDataUrl) {
      const base64Data = mediaFiles.thumbnailDataUrl.replace(/^data:image\/\w+;base64,/, '');
      folder.file('thumbnail.png', base64Data, { base64: true });
    }

    if (mediaFiles?.flashcardDataUrl) {
      const base64Data = mediaFiles.flashcardDataUrl.replace(/^data:image\/\w+;base64,/, '');
      folder.file('flashcard.png', base64Data, { base64: true });
    }

    if (mediaFiles?.squarePostDataUrl) {
      const base64Data = mediaFiles.squarePostDataUrl.replace(/^data:image\/\w+;base64,/, '');
      folder.file('square-post.png', base64Data, { base64: true });
    }

    return await zip.generateAsync({ type: 'blob' });
  }

  /**
   * Triggers client-side browser file download
   */
  public static triggerDownload(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Helper to download single text file
   */
  public static downloadTextFile(content: string, fileName: string) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    this.triggerDownload(blob, fileName);
  }
}
