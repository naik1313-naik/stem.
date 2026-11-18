/**
 * IndexedDB storage layer for offline-first SmartClass Buddy.
 * Handles learning progress, quiz results, downloaded packages, and sync queue.
 */

export type Language = 'en' | 'hi';
export type SubjectId = 'physics' | 'chemistry' | 'mathematics' | 'biology';
export type ClassId = '6' | '7' | '8';

export interface LearningEvent {
  id: string;
  type: 'attempt' | 'hint' | 'complete';
  screen: string;
  groupId: string;
  detail: string;
  at: string;
  challenge?: number;
  subject?: SubjectId;
  classId?: ClassId;
  activityId?: string;
}

export interface QuizResult {
  id: string;
  subject: SubjectId;
  classId: ClassId;
  activityId: string;
  score: number;
  total: number;
  completedAt: string;
  synced: boolean;
}

export interface ActivityProgress {
  id: string;
  subject: SubjectId;
  classId: ClassId;
  activityId: string;
  type: 'activity_opened' | 'activity_completed' | 'quiz_completed';
  score?: number;
  completedAt: string;
  synced: boolean;
}

export interface DownloadedPackage {
  subject: SubjectId;
  classId: ClassId;
  downloadedAt: string;
  size: number;
  version: string;
}

export interface SyncQueueItem {
  id: string;
  type: 'progress' | 'quiz' | 'event';
  payload: unknown;
  createdAt: string;
  retries: number;
}

const DB_NAME = 'smartclass-buddy';
const DB_VERSION = 2;

const STORES = {
  EVENTS: 'learningEvents',
  QUIZ_RESULTS: 'quizResults',
  ACTIVITY_PROGRESS: 'activityProgress',
  DOWNLOADED_PACKAGES: 'downloadedPackages',
  SYNC_QUEUE: 'syncQueue',
  SETTINGS: 'settings',
} as const;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;

      if (oldVersion < 1) {
        // Initial stores
        db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        db.createObjectStore(STORES.QUIZ_RESULTS, { keyPath: 'id' });
        db.createObjectStore(STORES.ACTIVITY_PROGRESS, { keyPath: 'id' });
        db.createObjectStore(STORES.DOWNLOADED_PACKAGES, { keyPath: ['subject', 'classId'] });
        db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (oldVersion < 2) {
        // Add indexes for better querying
        const eventsStore = request.transaction?.objectStore(STORES.EVENTS);
        if (eventsStore) {
          eventsStore.createIndex('groupId', 'groupId', { unique: false });
          eventsStore.createIndex('subject', 'subject', { unique: false });
          eventsStore.createIndex('at', 'at', { unique: false });
        }

        const progressStore = request.transaction?.objectStore(STORES.ACTIVITY_PROGRESS);
        if (progressStore) {
          progressStore.createIndex('subjectClass', ['subject', 'classId'], { unique: false });
          progressStore.createIndex('synced', 'synced', { unique: false });
        }

        const quizStore = request.transaction?.objectStore(STORES.QUIZ_RESULTS);
        if (quizStore) {
          quizStore.createIndex('subjectClass', ['subject', 'classId'], { unique: false });
          quizStore.createIndex('synced', 'synced', { unique: false });
        }
      }
    };
  });

  return dbPromise;
}

// Helper to wrap IDBRequest in a Promise
function requestPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  storeName: string,
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const promise = callback(store);
    promise.then(resolve).catch(reject);
    transaction.onerror = () => reject(transaction.error);
    transaction.oncomplete = () => { /* complete */ };
  });
}

// Learning Events
export async function saveEvent(event: LearningEvent): Promise<void> {
  await withStore(STORES.EVENTS, 'readwrite', (store) => requestPromise(store.put(event)));
}

export async function getEvents(groupId: string, limit = 300): Promise<LearningEvent[]> {
  return withStore(STORES.EVENTS, 'readonly', (store) => {
    const index = store.index('groupId');
    return requestPromise(index.getAll(IDBKeyRange.only(groupId))).then((events) =>
      events
        .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
        .slice(0, limit)
    );
  });
}

export async function getAllEvents(limit = 300): Promise<LearningEvent[]> {
  return withStore(STORES.EVENTS, 'readonly', (store) => {
    const index = store.index('at');
    return requestPromise(index.getAll(null, limit)).then((events) =>
      events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    );
  });
}

// Quiz Results
export async function saveQuizResult(result: QuizResult): Promise<void> {
  await withStore(STORES.QUIZ_RESULTS, 'readwrite', (store) => requestPromise(store.put(result)));
}

export async function getQuizResults(subject: SubjectId, classId: ClassId): Promise<QuizResult[]> {
  return withStore(STORES.QUIZ_RESULTS, 'readonly', (store) => {
    const index = store.index('subjectClass');
    return requestPromise(index.getAll(IDBKeyRange.only([subject, classId])));
  });
}

export async function getUnsyncedQuizResults(): Promise<QuizResult[]> {
  return withStore(STORES.QUIZ_RESULTS, 'readonly', (store) => {
    const index = store.index('synced');
    return requestPromise(index.getAll(IDBKeyRange.only(false)));
  });
}

export async function markQuizResultSynced(id: string): Promise<void> {
  await withStore(STORES.QUIZ_RESULTS, 'readwrite', async (store) => {
    const result = await requestPromise(store.get(id));
    if (result) {
      result.synced = true;
      await requestPromise(store.put(result));
    }
  });
}

// Activity Progress
export async function saveActivityProgress(progress: ActivityProgress): Promise<void> {
  await withStore(STORES.ACTIVITY_PROGRESS, 'readwrite', (store) => requestPromise(store.put(progress)));
}

export async function getActivityProgress(subject: SubjectId, classId: ClassId): Promise<ActivityProgress[]> {
  return withStore(STORES.ACTIVITY_PROGRESS, 'readonly', (store) => {
    const index = store.index('subjectClass');
    return requestPromise(index.getAll(IDBKeyRange.only([subject, classId])));
  });
}

export async function getUnsyncedActivityProgress(): Promise<ActivityProgress[]> {
  return withStore(STORES.ACTIVITY_PROGRESS, 'readonly', (store) => {
    const index = store.index('synced');
    return requestPromise(index.getAll(IDBKeyRange.only(false)));
  });
}

export async function markActivityProgressSynced(id: string): Promise<void> {
  await withStore(STORES.ACTIVITY_PROGRESS, 'readwrite', async (store) => {
    const progress = await requestPromise(store.get(id));
    if (progress) {
      progress.synced = true;
      await requestPromise(store.put(progress));
    }
  });
}

// Downloaded Packages
export async function saveDownloadedPackage(pkg: DownloadedPackage): Promise<void> {
  await withStore(STORES.DOWNLOADED_PACKAGES, 'readwrite', (store) => requestPromise(store.put(pkg)));
}

export async function getDownloadedPackages(): Promise<DownloadedPackage[]> {
  return withStore(STORES.DOWNLOADED_PACKAGES, 'readonly', (store) => requestPromise(store.getAll()));
}

export async function isPackageDownloaded(subject: SubjectId, classId: ClassId): Promise<boolean> {
  return withStore(STORES.DOWNLOADED_PACKAGES, 'readonly', (store) =>
    requestPromise(store.get([subject, classId])).then((result) => !!result)
  );
}

export async function removeDownloadedPackage(subject: SubjectId, classId: ClassId): Promise<void> {
  await withStore(STORES.DOWNLOADED_PACKAGES, 'readwrite', (store) => requestPromise(store.delete([subject, classId])));
}

// Sync Queue
export async function addToSyncQueue(item: SyncQueueItem): Promise<void> {
  await withStore(STORES.SYNC_QUEUE, 'readwrite', (store) => requestPromise(store.put(item)));
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return withStore(STORES.SYNC_QUEUE, 'readonly', (store) => requestPromise(store.getAll()));
}

export async function removeFromSyncQueue(id: string): Promise<void> {
  await withStore(STORES.SYNC_QUEUE, 'readwrite', (store) => requestPromise(store.delete(id)));
}

export async function incrementSyncRetry(id: string): Promise<void> {
  await withStore(STORES.SYNC_QUEUE, 'readwrite', async (store) => {
    const item = await requestPromise(store.get(id));
    if (item) {
      item.retries += 1;
      await requestPromise(store.put(item));
    }
  });
}

// Settings (for language, group, etc.)
export async function saveSetting(key: string, value: unknown): Promise<void> {
  await withStore(STORES.SETTINGS, 'readwrite', (store) => requestPromise(store.put({ key, value })));
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  return withStore(STORES.SETTINGS, 'readonly', (store) =>
    requestPromise(store.get(key)).then((result) => result?.value as T ?? fallback)
  );
}

// Offline Spark responses
export interface OfflineSparkResponse {
  subject: SubjectId;
  topic?: string;
  answer: string;
  language: Language;
}

const OFFLINE_SPARK_RESPONSES: Record<SubjectId, Record<Language, string>> = {
  physics: {
    en: "Physics: Change one thing at a time, observe what changes, and explain the cause. Use the model's measurements and the safety notice rather than treating the simulation as a real experiment.",
    hi: "भौतिक विज्ञान में एक बार में केवल एक चीज़ बदलें, परिणाम देखें और कारण समझाएँ। मॉडल को वास्तविक प्रयोग न मानें।",
  },
  chemistry: {
    en: "Chemistry: Make a prediction, change one virtual setting, and compare the observation with the prediction. Never taste or mix real chemicals; this lab uses safe conceptual models.",
    hi: "रसायन विज्ञान में पहले अनुमान लगाएँ, फिर वर्चुअल सेटिंग बदलें और परिणाम की तुलना करें। वास्तविक रसायन न छुएँ या न मिलाएँ।",
  },
  mathematics: {
    en: "Mathematics: Use the live model, substitute the shown values, and check whether the result follows the rule. Estimate first, calculate next, then explain your answer.",
    hi: "गणित में पहले अनुमान लगाएँ, दिखाए गए मान डालें और नियम से उत्तर जाँचें।",
  },
  biology: {
    en: "Biology: Observe the selected structure or process, connect form to function, and explain how the parts interact. Use respectful, age-appropriate biological language.",
    hi: "जीव विज्ञान में संरचना और उसके कार्य के संबंध को देखें। जीवों और प्रक्रियाओं के बारे में सम्मानजनक और सुरक्षित ढंग से समझाएँ।",
  },
};

export function getOfflineSparkResponse(subject: SubjectId, language: Language, topic?: string): string {
  let base = OFFLINE_SPARK_RESPONSES[subject][language];
  if (topic) {
    base = `${topic}: ${base}`;
  }
  return `[Offline] ${base}`;
}

// Generate unique IDs
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Clear all data (for testing or reset)
export async function clearAllData(): Promise<void> {
  const db = await openDB();
  const storeNames = Object.values(STORES);
  await Promise.all(
    storeNames.map((name) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(name, 'readwrite');
        const store = tx.objectStore(name);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      })
    )
  );
}