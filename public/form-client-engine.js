(() => {
  if (window.createSiteFormClient) return;
  const initializers = new Set();
  window.bindSiteFormInitializer = (key, initialize) => {
    if (initializers.has(key)) return;
    initializers.add(key);
    document.addEventListener('astro:page-load', initialize);
    initialize();
  };
  window.createSiteFormClient = (options) => {
    const { form, button, label = button, status } = options;
    if (
      !form ||
      !button ||
      !status ||
      form.dataset[options.boundKey || 'bound']
    )
      return;
    form.dataset[options.boundKey || 'bound'] = 'true';
    const originalLabel = label.textContent;
    const fields = new Set(options.fields || []);
    let generation = 0;
    let controller;
    let accepted = false;
    let departed = false;
    const restore = () => {
      button.disabled = false;
      label.textContent = originalLabel;
    };
    const setStatus = (message, kind = '') => {
      status.textContent = message;
      status.className = `form-status ${kind}`.trim();
      if (kind === 'failure' && options.focusStatus)
        status.focus({ preventScroll: false });
    };
    const fieldError = (name, message) => {
      if (!fields.has(name)) return null;
      const id = `${options.errorPrefix || 'error-'}${name}`;
      const controls = form.querySelectorAll(`[name="${name}"]`);
      let error =
        form.querySelector(`[data-error="${name}"]`) ||
        document.getElementById(id);
      if (!message) {
        if (error?.dataset?.error) error.textContent = '';
        else error?.remove();
      }
      let first = null;
      for (const control of controls) {
        first ||= control;
        if (message && !error) {
          error = document.createElement('span');
          error.id = id;
          error.className = 'field-error';
          control.closest('label')?.append(error);
        }
        if (message && error) {
          error.id = id;
          error.textContent = String(message).slice(0, 300);
          control.setAttribute('aria-invalid', 'true');
        } else control.removeAttribute('aria-invalid');
        const described = (control.getAttribute('aria-describedby') || '')
          .split(/\s+/)
          .filter((value) => value && value !== id);
        if (message && error) described.push(id);
        if (described.length)
          control.setAttribute(
            'aria-describedby',
            [...new Set(described)].join(' '),
          );
        else control.removeAttribute('aria-describedby');
      }
      return first;
    };
    const showErrors = (errors) => {
      if (!errors || typeof errors !== 'object' || Array.isArray(errors))
        return null;
      let first = null;
      for (const control of form.querySelectorAll('input,select,textarea')) {
        if (
          fields.has(control.name) &&
          typeof errors[control.name] === 'string' &&
          errors[control.name].trim()
        ) {
          fieldError(control.name, errors[control.name]);
          first ||= control;
        }
      }
      return first;
    };
    const changed = (event) => {
      fieldError(event.target.name, '');
      options.renewRetry?.();
      options.onChange?.(event);
    };
    form.addEventListener('input', changed);
    form.addEventListener('change', changed);
    const cancel = () => {
      generation++;
      departed = true;
      controller?.abort();
    };
    window.addEventListener('pagehide', cancel);
    const beforeSwap = () => {
      cancel();
      window.removeEventListener?.('pagehide', cancel);
      window.removeEventListener?.('pageshow', restorePage);
      document.removeEventListener?.('astro:before-swap', beforeSwap);
    };
    document.addEventListener('astro:before-swap', beforeSwap);
    const restorePage = (event) => {
      if (!event.persisted) return;
      cancel();
      departed = false;
      restore();
      options.resetChallenge?.();
      setStatus('');
      if (accepted) options.renewAcceptedRetry?.();
      accepted = false;
    };
    window.addEventListener('pageshow', restorePage);
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (button.disabled || departed || form.isConnected === false) return;
      window.siteConfirmation?.clear();
      setStatus('');
      for (const name of fields) fieldError(name, '');
      const formData = new FormData(form);
      const request = options.prepare(formData, { fieldError, setStatus });
      if (!request) return;
      const attempt = ++generation;
      const activeController = new AbortController();
      controller = activeController;
      button.disabled = true;
      label.textContent = options.sendingLabel || 'Sending…';
      let timedOut = false;
      let invalidField;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        activeController.abort();
      }, options.timeoutMs || 30000);
      const active = () =>
        attempt === generation && !departed && form.isConnected !== false;
      try {
        const response = await fetch(request.url || form.action, {
          method: 'POST',
          headers: request.headers,
          body: request.body,
          signal: activeController.signal,
        });
        const raw = await response.json().catch(() => null);
        if (!active()) return;
        const body =
          raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
        if (!response.ok) {
          invalidField = showErrors(body.fieldErrors);
          throw new Error(
            options.responseError?.(body) || options.failureMessage,
          );
        }
        if (body.ok !== true)
          throw new Error(options.unconfirmedMessage || options.failureMessage);
        accepted = true;
        window.siteConfirmation?.rememberAccepted(
          String(formData.get('name') || ''),
          options.destination,
        );
        restore();
        window.location.assign(options.destination);
      } catch (error) {
        if (!active()) return;
        options.resetChallenge?.();
        setStatus(
          timedOut
            ? options.timeoutMessage
            : error instanceof Error
              ? error.message
              : options.failureMessage,
          'failure',
        );
        invalidField?.focus();
      } finally {
        window.clearTimeout(timeout);
        if (active()) restore();
      }
    });
    return { fieldError, setStatus };
  };
})();
