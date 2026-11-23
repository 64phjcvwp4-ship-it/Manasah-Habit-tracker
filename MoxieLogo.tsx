/** Glass-slab inspired Moxie wordmark. 
 *  Swap with real <GlassSlabLogo /> later. */
export function MoxieLogo({ small = false }: { small?: boolean }) {
  return (
    <div
      className="moxie-logo"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.55rem',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        fontSize: small ? '1rem' : '1.25rem',
        letterSpacing: '-0.03em',
      }}
    >
      <div
        style={{
          width: small ? 28 : 34,
          height: small ? 28 : 34,
          borderRadius: 10,
          background: 'linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #7c3aed 100%)',
          boxShadow: '0 0 20px rgba(167,139,250,0.45), inset 0 1px 0 rgba(255,255,255,0.35)',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontSize: small ? 14 : 16,
            fontWeight: 700,
            color: '#0a0014',
            position: 'relative',
            zIndex: 1,
          }}
        >
          M
        </span>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
            animation: 'shine 3.5s ease-in-out infinite',
          }}
        />
      </div>
      <span>Moxie</span>
      <style>{`
        @keyframes shine {
          0%, 100% { transform: translateX(-120%); }
          50% { transform: translateX(120%); }
        }
      `}</style>
    </div>
  )
}
