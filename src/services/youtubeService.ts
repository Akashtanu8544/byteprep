import { getCachedAccessToken } from './authService';

export interface YouTubeChannelInfo {
  id: string;
  title: string;
  customUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: string;
  videoCount?: string;
}

export interface YouTubeUploadResult {
  videoId: string;
  videoUrl: string;
  title: string;
  status: string;
}

export class YouTubeService {
  /**
   * Fetches the authenticated user's genuine YouTube Channel details
   */
  public static async getMyChannel(accessToken?: string): Promise<YouTubeChannelInfo | null> {
    const token = accessToken || getCachedAccessToken();
    if (!token) {
      throw new Error('No Google OAuth access token found. Please sign in with Google first.');
    }

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(
        errJson.error?.message || `YouTube API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];
    return {
      id: channel.id,
      title: channel.snippet?.title || 'My YouTube Channel',
      customUrl: channel.snippet?.customUrl,
      thumbnailUrl:
        channel.snippet?.thumbnails?.default?.url ||
        channel.snippet?.thumbnails?.medium?.url,
      subscriberCount: channel.statistics?.subscriberCount,
      videoCount: channel.statistics?.videoCount,
    };
  }

  /**
   * Uploads a video blob genuinely to YouTube as a YouTube Short
   */
  public static async uploadShortVideo(params: {
    videoBlob: Blob;
    title: string;
    description: string;
    tags?: string[];
    privacyStatus?: 'public' | 'unlisted' | 'private';
    onProgress?: (percent: number) => void;
    accessToken?: string;
  }): Promise<YouTubeUploadResult> {
    const token = params.accessToken || getCachedAccessToken();
    if (!token) {
      throw new Error('Authentication required: please connect your YouTube account.');
    }

    // Ensure #Shorts tag is present for automatic YouTube Shorts feed classification
    const tags = Array.from(
      new Set([
        ...(params.tags || []),
        'Shorts',
        'BytePrep',
        'ComputerScience',
        'Quiz',
        '10SecChallenge',
      ])
    );

    let title = params.title;
    if (!title.toLowerCase().includes('#shorts') && !title.toLowerCase().includes('shorts')) {
      title = `${title.slice(0, 90)} #Shorts`;
    }

    const metadata = {
      snippet: {
        title: title.slice(0, 100),
        description: `${params.description}\n\n#Shorts #BytePrep #CSQuiz`,
        tags,
        categoryId: '27', // Education Category ID on YouTube
      },
      status: {
        privacyStatus: params.privacyStatus || 'public',
        selfDeclaredMadeForKids: false,
      },
    };

    // Resumable / Multi-part Upload to YouTube
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
      metadata
    )}\r\n`;

    const videoMimeType = params.videoBlob.type || 'video/mp4';
    const videoHeader = `${delimiter}Content-Type: ${videoMimeType}\r\n\r\n`;

    // Convert Blob to ArrayBuffer for binary multipart
    const videoArrayBuffer = await params.videoBlob.arrayBuffer();

    const preArray = new TextEncoder().encode(metadataPart + videoHeader);
    const postArray = new TextEncoder().encode(closeDelimiter);

    const fullPayload = new Uint8Array(
      preArray.byteLength + videoArrayBuffer.byteLength + postArray.byteLength
    );
    fullPayload.set(preArray, 0);
    fullPayload.set(new Uint8Array(videoArrayBuffer), preArray.byteLength);
    fullPayload.set(postArray, preArray.byteLength + videoArrayBuffer.byteLength);

    const uploadResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': fullPayload.byteLength.toString(),
        },
        body: fullPayload,
      }
    );

    if (!uploadResponse.ok) {
      const errData = await uploadResponse.json().catch(() => ({}));
      throw new Error(
        errData.error?.message || `Upload failed with HTTP ${uploadResponse.status}`
      );
    }

    const uploaded = await uploadResponse.json();
    const videoId = uploaded.id;

    return {
      videoId,
      videoUrl: `https://youtube.com/shorts/${videoId}`,
      title: uploaded.snippet?.title || params.title,
      status: uploaded.status?.privacyStatus || 'uploaded',
    };
  }
}
