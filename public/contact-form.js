(() => {
  function initializeContact() {
    const form = document.querySelector('#inquiry-form');
    const status = document.querySelector('#form-status');
    const button = document.querySelector('#submit-button');
    const label = document.querySelector('[data-button-label]');
    if (!form || !status || !button || !label || form.dataset.bound) return;
    const phoneInput = form.elements.namedItem('phone');
    const contactMethod = form.querySelector('[name=contactMethod]');
    const updatePhoneRequirement = () => {
      const needsPhone =
        contactMethod.value === 'phone' || contactMethod.value === 'text';
      phoneInput.required = needsPhone;
      phoneInput.setAttribute('aria-required', String(needsPhone));
    };
    updatePhoneRequirement();
    window.createSiteFormClient({
      form,
      button,
      label,
      status,
      fields: [
        'name',
        'email',
        'phone',
        'company',
        'websiteUrl',
        'contactMethod',
        'contactTime',
        'timezone',
        'projectType',
        'currentWebsite',
        'timeline',
        'budget',
        'source',
        'message',
      ],
      destination: '/contact/success/',
      timeoutMs: 30000,
      onChange: (event) => {
        if (event.target.name === 'contactMethod') updatePhoneRequirement();
      },
      resetChallenge: () => window.__alienxTurnstileReset?.(),
      renewRetry: () => {
        delete form.dataset.inquiryId;
      },
      renewAcceptedRetry: () => {
        delete form.dataset.inquiryId;
      },
      failureMessage: 'We could not send your message. Please try again.',
      timeoutMessage:
        'The request timed out. Please complete the security check and try again.',
      responseError: (body) =>
        typeof body.error === 'string' ? body.error : '',
      prepare: (formData, { fieldError }) => {
        const value = (field) => String(formData.get(field) ?? '').trim();
        const name = value('name');
        const email = value('email');
        const phone = value('phone');
        const websiteUrl = value('websiteUrl');
        const message = value('message');
        let firstInvalid = null;
        if (name.length < 2 || name.length > 100) {
          fieldError('name', 'Please enter your name.');
          firstInvalid = form.elements.namedItem('name');
        }
        if (
          !email ||
          email.length > 254 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
          fieldError('email', 'Please enter a valid email address.');
          firstInvalid ??= form.elements.namedItem('email');
        }
        if (
          (contactMethod.value === 'phone' || contactMethod.value === 'text') &&
          (!phone || !/^[+()\d\s.-]+$/.test(phone))
        ) {
          fieldError(
            'phone',
            'A valid phone number is required for this contact method.',
          );
          firstInvalid ??= phoneInput;
        } else if (
          phone &&
          (phone.length > 30 || !/^[+()\d\s.-]+$/.test(phone))
        ) {
          fieldError('phone', 'Please enter a valid phone number.');
          firstInvalid ??= phoneInput;
        }
        if (websiteUrl) {
          try {
            const url = new URL(websiteUrl);
            if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
          } catch {
            fieldError('websiteUrl', 'Please enter a valid website URL.');
            firstInvalid ??= form.elements.namedItem('websiteUrl');
          }
        }
        if (!contactMethod.value) {
          fieldError(
            'contactMethod',
            'Please choose how you would like us to contact you.',
          );
          firstInvalid ??= contactMethod;
        }
        if (!formData.get('projectType')) {
          fieldError(
            'projectType',
            'Please choose what you are interested in.',
          );
          firstInvalid ??= form.querySelector('[name=projectType]');
        }
        if (message.length < 10 || message.length > 4000) {
          fieldError(
            'message',
            'Please provide at least a few sentences about the project.',
          );
          firstInvalid ??= form.elements.namedItem('message');
        }
        if (firstInvalid) {
          firstInvalid.focus();
          return;
        }

        return {
          url: '/api/inquiry',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': (form.dataset.inquiryId ??= crypto.randomUUID()),
          },
          body: JSON.stringify({
            name,
            email,
            phone,
            company: value('company'),
            websiteUrl,
            contactMethod: value('contactMethod'),
            contactTime: value('contactTime'),
            timezone: value('timezone'),
            projectType: value('projectType'),
            currentWebsite: value('currentWebsite'),
            timeline: value('timeline'),
            budget: value('budget'),
            source: value('source'),
            message,
            faxNumber: value('inquiryReference'),
            website: String(formData.get('website') ?? ''),
          }),
        };
      },
    });
  }
  window.bindSiteFormInitializer('inquiry', initializeContact);
})();
