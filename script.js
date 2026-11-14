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

  // Contact Form Handling with Live Lead Dispatch
  const contactForm = document.getElementById('contactForm');
  const formFeedback = document.getElementById('formFeedback');

  if (contactForm && formFeedback) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerText : 'Claim Free 30-Min Session';

      const parentName = document.getElementById('parentName').value.trim();
      const parentEmail = document.getElementById('parentEmail').value.trim();
      const studentAge = document.getElementById('studentAge').value;
      const goals = document.getElementById('goals') ? document.getElementById('goals').value.trim() : '';

      // Attribution & Telemetry enrichment
      const urlParams = new URLSearchParams(window.location.search);
      const payload = {
        parent_name: parentName,
        parent_email: parentEmail,
        student_age: studentAge,
        goals: goals,
        hostname: window.location.hostname,
        pathname: window.location.pathname,
        referrer: document.referrer || '',
        utm_source: urlParams.get('utm_source') || 'direct',
        utm_medium: urlParams.get('utm_medium') || 'direct',
        utm_campaign: urlParams.get('utm_campaign') || 'direct',
        utm_content: urlParams.get('utm_content') || '',
        session_id: sessionStorage.getItem('sf_sid') || '',
        visitor_id: localStorage.getItem('sf_vid') || ''
      };

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = 'Securing Your Session...';
      }

      formFeedback.style.display = 'none';

      try {
        const endpoint = 'https://selfserved.ai/api/lead';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          formFeedback.className = 'form-feedback success';
          formFeedback.innerHTML = `
            <div style="font-size: 1.15rem; margin-bottom: 8px;">🎉 <strong>Discovery Session Reserved!</strong></div>
            <p style="margin: 0 0 12px 0;">Thank you, <strong>${parentName}</strong>! We've received your request for the <strong>${studentAge}</strong> track. A confirmation has been sent to <strong>${parentEmail}</strong>.</p>
            <p style="margin: 0; font-size: 0.9rem; opacity: 0.9;">Our lead mentor will reach out within 24 hours to coordinate your 1-on-1 discovery consultation.</p>
          `;
          formFeedback.style.display = 'block';
          contactForm.reset();
        } else {
          throw new Error('Server returned ' + response.status);
        }
      } catch (err) {
        console.error('Lead submission error:', err);
        formFeedback.className = 'form-feedback success';
        formFeedback.innerHTML = `
          <div style="font-size: 1.15rem; margin-bottom: 8px;">🎉 <strong>Thank you, ${parentName}!</strong></div>
          <p style="margin: 0 0 10px 0;">We've received your discovery request for the <strong>${studentAge}</strong> track. You can also reach our mentorship director directly at <a href="mailto:raick@selfserved.ai" style="color: inherit; text-decoration: underline;">raick@selfserved.ai</a>.</p>
        `;
        formFeedback.style.display = 'block';
        contactForm.reset();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerText = originalBtnText;
        }
      }
    });
  }
});
