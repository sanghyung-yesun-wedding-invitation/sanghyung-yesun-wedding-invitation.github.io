// Public JavaScript key, restricted to the invitation domain in Kakao Developers.
const weddingKakaoKey = '376afc398b5fb2051a1d959cd83458d6';
let weddingKakaoReady;
function loadWeddingKakao() {
  if (weddingKakaoReady) return weddingKakaoReady;
  weddingKakaoReady = new Promise((resolve, reject) => {
    const initialize = () => {
      try {
        if (!window.Kakao.isInitialized()) window.Kakao.init(weddingKakaoKey);
        resolve(window.Kakao);
      } catch (error) { reject(error); }
    };
    if (window.Kakao?.Share) { initialize(); return; }
    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.8.4/kakao.min.js';
    script.crossOrigin = 'anonymous';
    script.integrity = 'sha384-BGX7Wb16GmRFagri4bLJV2DgipVZaU2AI812GZtHtHzzDQJnfHasDXN5houxv45w';
    script.onload = initialize;
    script.onerror = () => { script.remove(); reject(new Error('Kakao SDK unavailable')); };
    document.head.append(script);
  }).catch(error => { weddingKakaoReady = null; throw error; });
  return weddingKakaoReady;
}
function setupKakaoShare(modal, url) {
  const button = modal.querySelector('[data-share-kakao]');
  const status = modal.querySelector('.share-status');
  let ready = false;
  const prepare = () => {
    button.disabled = true;
    return loadWeddingKakao().then(() => { ready = true; }).finally(() => { button.disabled = false; });
  };
  prepare().catch(() => {});
  button.onclick = () => {
    status.textContent = '';
    if (!ready) {
      prepare().then(() => { status.textContent = '준비되었습니다. 카카오톡 공유 버튼을 다시 눌러 주세요.'; })
        .catch(() => { status.textContent = '카카오톡 공유를 불러오지 못했습니다. 잠시 후 다시 시도하거나 링크 복사를 이용해 주세요.'; });
      return;
    }
    try {
      const result = window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '정상형 · 최예선 결혼합니다',
          description: '2027년 1월 3일 일요일 오전 11시 30분\n빌라드지디 청담',
          imageUrl: new URL('assets/kakao-share-portrait.jpg', url).href,
          imageWidth: 1200,
          imageHeight: 1600,
          link: { mobileWebUrl: url, webUrl: url }
        },
        buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }]
      });
      Promise.resolve(result).catch(() => { status.textContent = '카카오톡 공유창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.'; });
    } catch (error) {
      status.textContent = '카카오톡 공유창을 열지 못했습니다. 잠시 후 다시 시도해 주세요.';
    }
  };
}
