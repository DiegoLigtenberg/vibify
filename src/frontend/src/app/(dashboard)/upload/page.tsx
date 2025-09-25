'use client';

import { MusicUpload } from '../../../components/upload/music-upload';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

export default function UploadPage() {
  return <MusicUpload />;
}
