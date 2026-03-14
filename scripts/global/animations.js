/**
 * Global Animations
 *
 * Shared scroll-reveal and fade-in animations using GSAP ScrollTrigger.
 * Loaded site-wide. Targets elements with [data-animation-general].
 * GSAP is loaded via Webflow's built-in CDN toggle — available globally.
 */
;(function () {
  'use strict'

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
      console.warn('[animations] GSAP or ScrollTrigger not loaded — ensure Webflow GSAP toggle is enabled')
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    // Fade-in on scroll for elements with data-animation-general
    const elements = document.querySelectorAll('[data-animation-general]')

    elements.forEach(function (el) {
      gsap.from(el, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none'
        }
      })
    })
  })
})()
