import { ImageResponse } from 'next/og';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          backgroundColor: '#FDF8F0',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '80px 100px',
          position: 'relative',
        }}
      >
        {/* Gold top bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 10,
            backgroundColor: '#F5C842',
          }}
        />

        {/* App name */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 108,
            fontWeight: 700,
            color: '#1C1008',
            lineHeight: 1,
            letterSpacing: '-2px',
          }}
        >
          WhichPark?
        </div>

        {/* Tagline */}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: 38,
            fontWeight: 400,
            color: '#8B7355',
            marginTop: 28,
          }}
        >
          The question isn't if. It's where.
        </div>

        {/* Domain */}
        <div
          style={{
            position: 'absolute',
            bottom: 60,
            left: 100,
            fontFamily: 'sans-serif',
            fontSize: 22,
            color: '#C4B49A',
            letterSpacing: '3px',
          }}
        >
          WHICHPARK.COM
        </div>
      </div>
    ),
    { ...size }
  );
}
