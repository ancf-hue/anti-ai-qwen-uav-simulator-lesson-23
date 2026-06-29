// Service Worker для офлайн-работы
// Anti-AI Qwen UAV Simulator Lesson 23

const CACHE_NAME = 'uav-simulator-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/uav-operator.jpg',
  '/vizhivshiy-theme.mp3',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// Установка Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✅ Кэш открыт');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('❌ Ошибка кэширования:', err);
      })
  );
  self.skipWaiting();
});

// Активация
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаление старого кэша:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Перехват запросов
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Если есть в кэше — возвращаем
        if (response) {
          return response;
        }
        
        // Иначе — загружаем из сети и кэшируем
        return fetch(event.request).then(
          response => {
            // Проверяем валидность ответа
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Клонируем ответ
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          }
        );
      })
      .catch(err => {
        console.error('❌ Ошибка загрузки:', err);
        // Если офлайн и нет в кэше — показываем офлайн-страницу
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
  );
});

// Очистка кэша по команде
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data.action === 'clearCache') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    });
  }
});

console.log('🚁 Service Worker загружен');