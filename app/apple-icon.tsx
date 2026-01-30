import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          background: 'linear-gradient(135deg, #3d2b1f 0%, #1a1a1a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#c9a227',
          borderRadius: '20%',
          fontFamily: 'Georgia, serif',
          fontWeight: 'bold',
        }}
      >
        F
      </div>
    ),
    {
      ...size,
    }
  )
}
