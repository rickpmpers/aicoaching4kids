// Interactive scripts for AI Kids Academy

document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    // Close menu when clicking link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // FAQ Accordion
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const header = item.querySelector('.accordion-header');
    header.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      // Close all
      accordionItems.forEach(i => i.classList.remove('active'));
      // If was not active, open
      if (!isActive) {
        item.classList.add('active');
      }
    });
  });

  // Contact Form Handling
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const parentName = document.getElementById('parentName').value;
      const parentEmail = document.getElementById('parentEmail').value;
      const studentAge = document.getElementById('studentAge').value;

      formFeedback.className = 'form-feedback success';
      formFeedback.innerHTML = `🎉 Thank you, <strong>${parentName}</strong>! We've received your request for the <strong>${studentAge}</strong> track. Our lead mentor will email you at <strong>${parentEmail}</strong> within 24 hours to schedule your free discovery consultation.`;

      contactForm.reset();
    });
  }
});
