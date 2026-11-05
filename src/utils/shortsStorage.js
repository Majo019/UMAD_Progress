const DATABASE_NAME = 'umad-progress-shorts';
const STORE_NAME = 'shorts';

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Este navegador no permite guardar videos localmente.'));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento de videos.'));
    request.onblocked = () => reject(new Error('El almacenamiento de videos está bloqueado por otra pestaña.'));
  });
}

export async function listShorts(userId) {
  if (!userId) throw new Error('Inicia sesión para ver tus Shorts.');
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).getAll();

    request.onsuccess = () => resolve(
      request.result
        .filter((short) => short.userId === userId)
        .sort((a, b) => b.createdAt - a.createdAt),
    );
    request.onerror = () => reject(request.error ?? new Error('No se pudieron cargar los videos.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('No se pudieron cargar los videos.'));
  });
}

export async function saveShort(file, title, userId) {
  if (!userId) throw new Error('Inicia sesión para guardar un Short.');
  const database = await openDatabase();
  const short = {
    id: `short-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    title: title.trim() || file.name,
    fileName: file.name,
    createdAt: Date.now(),
    video: file,
  };

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).add(short);
    transaction.oncomplete = () => resolve(short);
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar el video.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo guardar el video.'));
  });
}

export async function removeShort(id, userId) {
  if (!userId) throw new Error('Inicia sesión para eliminar un Short.');
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result?.userId !== userId) {
        transaction.abort();
        reject(new Error('No se encontró ese Short en tu cuenta.'));
        return;
      }
      store.delete(id);
    };
    request.onerror = () => reject(request.error ?? new Error('No se pudo encontrar el video.'));
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo eliminar el video.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('No se pudo eliminar el video.'));
  });
}
