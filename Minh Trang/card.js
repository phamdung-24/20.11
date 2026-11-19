(() => {
  'use strict';

  const defaultGreeting = {
    recipient: 'cô Trần Thị Minh Trang',
    message: 'Nhân ngày Nhà giáo Việt Nam 20/11, em chúc cô luôn khỏe mạnh, bình an và có thật nhiều niềm vui.\n\nMong cô sẽ được yêu thương từ những điều nhỏ nhất, có thời gian cho bản thân và tự tin theo đuổi những điều mình mong muốn.\n\nNụ cười của cô thật đẹp, cô hãy luôn tươi cười cô nhé.',
    sender: 'Em rất quý mến cô'
  };
  const dialog = document.getElementById('greetingCard');
  const openButton = document.getElementById('openCard');
  const closeButton = document.getElementById('closeCard');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const desktopLayout = window.matchMedia('(min-width: 1100px)');
  const sceneElements = [...document.querySelectorAll('.bouquet-composition, .scene-footer')];
  const layoutAnimations = new Set();
  const album = document.getElementById('memoryAlbum');
  const albumToggle = document.getElementById('toggleAlbum');
  const albumObserver = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      album.classList.add('is-revealed');
      albumObserver.unobserve(album);
    }
  }, { threshold: 0.08 });

  let albumRevealPromise;
  function revealAlbum() {
    if (albumRevealPromise) return albumRevealPromise;
    // Decode the photos before revealing the paper frames.
    const photos = [...album.querySelectorAll('img')];
    photos.forEach(photo => { photo.loading = 'eager'; });
    albumRevealPromise = Promise.allSettled(photos.map(photo => photo.decode()))
      .then(() => {
        album.hidden = false;
        albumObserver.observe(album);
      });
    return albumRevealPromise;
  }

  albumToggle.addEventListener('click', () => {
    const expanded = album.classList.toggle('is-spread');
    albumToggle.setAttribute('aria-expanded', String(expanded));
    albumToggle.innerHTML = expanded ? 'Gấp album <span aria-hidden="true">♡</span>' : 'Xòe album <span aria-hidden="true">♡</span>';
  });
  document.getElementById('viewAlbum').addEventListener('click', async () => {
    await revealAlbum();
    album.classList.add('is-revealed');
    album.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    albumToggle.focus({ preventScroll: true });
  });

  function reflowScene(changeLayout) {
    layoutAnimations.forEach(animation => animation.cancel());
    layoutAnimations.clear();
    const before = sceneElements.map(element => {
      const rect = element.getBoundingClientRect();
      return { left: rect.left + window.scrollX, top: rect.top + window.scrollY, width: rect.width, height: rect.height };
    });
    changeLayout();
    if (motion.matches) return;
    sceneElements.forEach((element, index) => {
      const after = element.getBoundingClientRect();
      if (!after.width || !after.height) return;
      const dx = before[index].left - after.left - window.scrollX;
      const dy = before[index].top - after.top - window.scrollY;
      const scale = element.matches('.bouquet-composition')
        ? ` scale(${before[index].width / after.width}, ${before[index].height / after.height})` : '';
      const animation = element.animate([
        { transform: `translate(${dx}px, ${dy}px)${scale}` },
        { transform: 'none' }
      ], { duration: 600, easing: 'cubic-bezier(.2,.8,.2,1)' });
      layoutAnimations.add(animation);
      animation.onfinish = () => layoutAnimations.delete(animation);
    });
  }

  function revealCard() {
    const rect = dialog.getBoundingClientRect();
    if (!desktopLayout.matches || rect.top < 16 || rect.top > window.innerHeight * 0.35 || rect.bottom > window.innerHeight - 16) {
      dialog.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'start' });
    }
  }

  function setCardOpen(open) {
    if (dialog.open === open) return;
    reflowScene(() => {
      if (open) {
        showReading();
        // A non-modal dialog participates in the page grid and reserves its own space.
        document.body.classList.add('card-open');
        dialog.show();
      } else {
        dialog.close();
        document.body.classList.remove('card-open');
        showReading();
      }
      openButton.setAttribute('aria-expanded', String(open));
      openButton.querySelector('.envelope-action').textContent = open ? 'Gấp thiệp' : 'Mở thiệp';
    });
    if (open) {
      closeButton.focus({ preventScroll: true });
      revealAlbum();
      revealCard();
      document.dispatchEvent(new Event('bouquet:celebrate'));
    } else {
      openButton.focus({ preventScroll: true });
      const rect = openButton.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        openButton.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth', block: 'center' });
      }
    }
  }

  motion.addEventListener('change', () => {
    if (motion.matches) {
      layoutAnimations.forEach(animation => animation.cancel());
      layoutAnimations.clear();
    }
  });

  function renderGreeting() {
    document.getElementById('cardRecipient').textContent = defaultGreeting.recipient;
    const paragraphs = defaultGreeting.message.split(/\n\s*\n/).map(text => {
      const paragraph = document.createElement('span');
      paragraph.className = 'message-paragraph';
      paragraph.textContent = text;
      return paragraph;
    });
    document.getElementById('cardMessage').replaceChildren(...paragraphs);
    document.getElementById('cardSender').textContent = defaultGreeting.sender;
  }

  function showReading() {
    dialog.setAttribute('aria-labelledby', 'cardTitle');
    dialog.scrollTop = 0;
  }

  document.addEventListener('bouquet:ready', () => { openButton.hidden = false; });
  document.addEventListener('bouquet:rose', event => {
    const wish = document.getElementById('roseWish');
    wish.classList.remove('is-new');
    wish.textContent = event.detail.message;
    // Restart the brief reveal even when two flowers share the same wish.
    void wish.offsetWidth;
    wish.classList.add('is-new');
  });
  document.getElementById('replayBloom').addEventListener('click', () => {
    document.dispatchEvent(new Event('bouquet:replay'));
    document.getElementById('roseWish').textContent = '';
  });

  openButton.addEventListener('click', () => setCardOpen(!dialog.open));
  closeButton.addEventListener('click', () => setCardOpen(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && dialog.open && !event.defaultPrevented) {
      event.preventDefault();
      setCardOpen(false);
    }
  });
  dialog.addEventListener('close', () => {
    if (dialog.open || !document.body.classList.contains('card-open')) return;
    document.body.classList.remove('card-open');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.querySelector('.envelope-action').textContent = 'Mở thiệp';
    showReading();
  });

  renderGreeting();
})();
