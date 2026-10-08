class IjLightbox extends HTMLElement {
  connectedCallback() {
    this.dialog = this.querySelector('dialog');
    this.image = this.querySelector('.ij-lightbox__image');
    this.counter = this.querySelector('.ij-lightbox__counter');
    this.index = 0;
    this.urls = [];
    this.alts = [];

    this.onPointerDown = (event) => {
      this.downX = event.clientX;
      this.downY = event.clientY;
    };
    this.onClick = (event) => {
      const slide = event.target.closest('media-gallery .product-media-container--image');
      if (!slide || event.target.closest('button, a, slideshow-controls')) return;
      if (Math.abs(event.clientX - this.downX) > 6 || Math.abs(event.clientY - this.downY) > 6) return;
      const gallery = slide.closest('media-gallery');
      const slides = [...gallery.querySelectorAll('.product-media-container--image')].filter((s) => s.querySelector('img'));
      const images = slides.map((s) => s.querySelector('img'));
      this.urls = images.map((img) => this.largeUrl(img));
      this.alts = images.map((img) => img.alt);
      this.open(Math.max(0, slides.indexOf(slide)));
    };
    document.addEventListener('pointerdown', this.onPointerDown, true);
    document.addEventListener('click', this.onClick);

    this.querySelector('.ij-lightbox__close').addEventListener('click', () => this.close());
    this.querySelector('.ij-lightbox__prev').addEventListener('click', () => this.show(this.index - 1));
    this.querySelector('.ij-lightbox__next').addEventListener('click', () => this.show(this.index + 1));
    this.dialog.addEventListener('click', (event) => {
      if (event.target === this.dialog || event.target.classList.contains('ij-lightbox__stage')) this.close();
    });
    this.dialog.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') this.show(this.index - 1);
      if (event.key === 'ArrowRight') this.show(this.index + 1);
    });
    this.dialog.addEventListener('pointerdown', (event) => {
      this.swipeX = event.clientX;
    });
    this.dialog.addEventListener('pointerup', (event) => {
      const dx = event.clientX - this.swipeX;
      if (event.pointerType !== 'mouse' && Math.abs(dx) > 50) this.show(this.index + (dx < 0 ? 1 : -1));
    });
    this.dialog.addEventListener('close', () => document.documentElement.classList.remove('ij-lightbox-open'));
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this.onPointerDown, true);
    document.removeEventListener('click', this.onClick);
  }

  largeUrl(img) {
    const url = new URL(img.currentSrc || img.src, window.location.href);
    url.searchParams.set('width', '2000');
    return url.toString();
  }

  open(index) {
    this.toggleAttribute('data-single', this.urls.length < 2);
    this.show(index);
    document.documentElement.classList.add('ij-lightbox-open');
    this.dialog.showModal();
    this.querySelector('.ij-lightbox__close').focus();
  }

  close() {
    this.dialog.close();
  }

  show(index) {
    const count = this.urls.length;
    if (!count) return;
    this.index = (index + count) % count;
    this.image.src = this.urls[this.index];
    this.image.alt = this.alts[this.index];
    this.counter.textContent = `${this.index + 1} / ${count}`;
  }
}

if (!customElements.get('ij-lightbox')) customElements.define('ij-lightbox', IjLightbox);
