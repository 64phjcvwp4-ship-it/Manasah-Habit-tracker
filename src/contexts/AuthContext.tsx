import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  VALIDATION_LIMITS,
} from '../firebase'

interface AuthContextValue {
  user: User | null
  authReady: boolean
  accountReady: boolean
  signingIn: boolean
  authError: string | null
  clearAuthError: () => void
  signInWithGoogle: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function sanitizeDisplayName(user: User): string {
  const raw = (user.displayName || user.email?.split('@')[0] || 'Maloxie Member').trim()
  return (raw || 'Maloxie Member').slice(0, VALIDATION_LIMITS.MAX_DISPLAY_NAME_LENGTH)
}

function sanitizeEmail(user: User): string {
  const raw = (user.email || '').trim()
  return raw.slice(0, VALIDATION_LIMITS.MAX_EMAIL_LENGTH)
}

function sanitizePhotoURL(user: User): string {
  const raw = (user.photoURL || '').trim()
  return raw.slice(0, VALIDATION_LIMITS.MAX_PHOTO_URL_LENGTH)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [accountReady, setAccountReady] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [fatalError, setFatalError] = useState<Error | null>(null)

  if (fatalError) {
    throw fatalError
  }

  useEffect(() => {
    let active = true

    const unsubscribe = onAuthStateChanged(auth, async nextUser => {
      if (!active) return
      setUser(nextUser)
      setAuthReady(true)

      if (!nextUser) {
        setAccountReady(false)
        return
      }

      if (!nextUser.emailVerified) {
        setAccountReady(false)
        setAuthError('Please verify your Google account email before syncing.')
        return
      }

      setAccountReady(false)
      const uid = nextUser.uid
      const displayName = sanitizeDisplayName(nextUser)
      const userPath = `users/${uid}`
      const privatePath = `users/${uid}/private/info`

      try {
        const userRef = doc(db, 'users', uid)
        let userSnap
        try {
          userSnap = await getDoc(userRef)
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, userPath)
        }

        if (!userSnap.exists()) {
          try {
            await setDoc(userRef, {
              ownerId: uid,
              displayName,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            })
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, userPath)
          }
        } else {
          const existingName = userSnap.data()?.displayName
          if (existingName !== displayName) {
            try {
              await updateDoc(userRef, {
                displayName,
                updatedAt: serverTimestamp(),
              })
            } catch (err) {
              handleFirestoreError(err, OperationType.UPDATE, userPath)
            }
          }
        }

        const email = sanitizeEmail(nextUser)
        const photoURL = sanitizePhotoURL(nextUser)
        if (email.length >= 3) {
          const privateRef = doc(db, 'users', uid, 'private', 'info')
          let privateSnap
          try {
            privateSnap = await getDoc(privateRef)
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, privatePath)
          }

          if (!privateSnap.exists()) {
            try {
              await setDoc(privateRef, {
                ownerId: uid,
                email,
                photoURL,
                updatedAt: serverTimestamp(),
              })
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, privatePath)
            }
          } else {
            const data = privateSnap.data()
            if (data?.email !== email || data?.photoURL !== photoURL) {
              try {
                await updateDoc(privateRef, {
                  email,
                  photoURL,
                  updatedAt: serverTimestamp(),
                })
              } catch (err) {
                handleFirestoreError(err, OperationType.UPDATE, privatePath)
              }
            }
          }
        }

        if (active) {
          setAccountReady(true)
          setAuthError(null)
        }
      } catch (err) {
        if (active) {
          setFatalError(err instanceof Error ? err : new Error(String(err)))
        }
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setSigningIn(true)
    setAuthError(null)
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const code = typeof err === 'object' && err && 'code' in err ? String((err as { code: string }).code) : ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError(null)
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups and try again.')
      } else {
        setAuthError(err instanceof Error ? err.message : 'Unable to sign in right now.')
      }
    } finally {
      setSigningIn(false)
    }
  }, [])

  const signOutUser = useCallback(async () => {
    setAuthError(null)
    try {
      await signOut(auth)
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to sign out.')
    }
  }, [])

  const clearAuthError = useCallback(() => setAuthError(null), [])

  return (
    <AuthContext.Provider
      value={{
        user,
        authReady,
        accountReady,
        signingIn,
        authError,
        clearAuthError,
        signInWithGoogle,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider')
  }
  return ctx
}
