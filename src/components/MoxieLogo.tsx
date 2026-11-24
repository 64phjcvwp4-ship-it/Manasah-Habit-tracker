export const USER_LOGO_SRC = '/maloxie-logo.png'

export function MoxieLogo({ small = false }: { small?: boolean }) {
  const size = small ? 28 : 36

  return (
    <div
      className="moxie-logo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: small ? '1rem' : '1.25rem',
        letterSpacing: '-0.03em',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <img
        src={USER_LOGO_SRC}
        alt="Maloxie logo"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          filter: 'brightness(0) invert(1)',
          display: 'block',
          flexShrink: 0,
        }}
      />
      <span>Maloxie</span>
    </div>
  )
}
