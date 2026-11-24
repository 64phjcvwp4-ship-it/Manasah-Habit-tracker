import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { doc, getDocFromServer, getFirestore } from 'firebase/firestore'
import firebaseConfig from '../firebase-applet-config.json'

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

googleProvider.setCustomParameters({
  prompt: 'select_account',
})

// Synchronized validation boundaries from firebase-blueprint.json
export const VALIDATION_LIMITS = {
  OWNER_ID_PATTERN: /^[a-zA-Z0-9_-]+$/,
  HEX_COLOR_PATTERN: /^#[0-9a-fA-F]{6}$/,
  DATE_KEY_PATTERN: /^\d{4}-\d{2}-\d{2}$/,
  REMINDER_TIME_PATTERN: /^([01]\d|2[0-3]):[0-5]\d$/,
  MAX_DISPLAY_NAME_LENGTH: 80,
  MAX_EMAIL_LENGTH: 254,
  MAX_PHOTO_URL_LENGTH: 512,
  MAX_HABIT_NAME_LENGTH: 80,
  MAX_NOTE_LENGTH: 280,
  MAX_NOTES_COUNT: 50,
  MAX_TAG_LENGTH: 24,
  MAX_TAGS_COUNT: 15,
  MAX_CREATE_FREEZE_TOKENS: 2,
  HISTORY_DAYS: 7,
} as const

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string
  operationType: OperationType
  path: string | null
  authInfo: {
    userId?: string | null
    email?: string | null
    emailVerified?: boolean | null
    isAnonymous?: boolean | null
    tenantId?: string | null
    providerInfo?: {
      providerId?: string | null
      email?: string | null
    }[]
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map(provider => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo))
  throw new Error(JSON.stringify(errInfo))
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'))
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.')
    }
  }
}

void testConnection()
