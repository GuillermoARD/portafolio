import { type ChangeEvent, type FormEvent, useRef, useState } from 'react';
import { sendContact } from '../lib/api';
import { type ContactErrors, type ContactValues, LIMITS, validateContact } from '../lib/validateContact';
import { socials } from '../data/profile';
import { Icon } from './Icon';
import { SectionHeading } from './SectionHeading';

type Status = 'idle' | 'sending' | 'success' | 'error';

const empty: ContactValues = { name: '', email: '', subject: '', message: '', website: '' };

export function Contact() {
  const [values, setValues] = useState<ContactValues>(empty);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactValues, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [feedback, setFeedback] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  const update = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const field = e.target.name as keyof ContactValues;
    const next = { ...values, [field]: e.target.value };
    setValues(next);
    if (touched[field]) setErrors((prev) => ({ ...prev, [field]: validateContact(next)[field] }));
  };

  const blur = (field: keyof ContactValues) => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateContact(values)[field] }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'sending') return;

    const found = validateContact(values);
    setErrors(found);
    setTouched({ name: true, email: true, subject: true, message: true });
    const firstInvalid = (Object.keys(found) as (keyof ContactValues)[])[0];
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)?.focus();
      setStatus('error');
      setFeedback('Revisa los campos marcados.');
      return;
    }

    setStatus('sending');
    setFeedback('Enviando mensaje…');
    const result = await sendContact(values);

    if (result.ok) {
      setStatus('success');
      setFeedback(
        result.mode === 'test'
          ? '¡Mensaje recibido! (Modo de prueba: el servidor lo guardó localmente, no se envió ningún correo.)'
          : '¡Gracias! Tu mensaje se envió correctamente. Te responderé pronto.',
      );
      setValues(empty);
      setTouched({});
      setErrors({});
    } else {
      setStatus('error');
      setFeedback(result.error);
      if (result.fieldErrors) setErrors(result.fieldErrors);
    }
  };

  const fieldProps = (field: keyof ContactValues) => ({
    id: `contact-${field}`,
    name: field,
    value: values[field],
    onChange: update,
    onBlur: () => blur(field),
    'aria-invalid': Boolean(errors[field]) || undefined,
    'aria-describedby': errors[field] ? `contact-${field}-error` : undefined,
  });

  const fieldError = (field: keyof ContactValues) =>
    errors[field] ? (
      <p id={`contact-${field}-error`} className="field__error">
        {errors[field]}
      </p>
    ) : null;

  const email = socials.find((s) => s.kind === 'email');

  return (
    <section id="contacto" className="section" aria-labelledby="contacto-title">
      <div className="container contact">
        <div className="contact__intro" data-reveal>
          <SectionHeading id="contacto-title" eyebrow="05" title="Contacto" />
          <p>
            ¿Tienes un proyecto, una vacante o una idea que quieras llevar a producción? Escríbeme y te responderé lo
            antes posible.
          </p>
          {email && (
            <a className="contact__mail" href={email.url}>
              <Icon name="email" /> {email.url.replace('mailto:', '')}
            </a>
          )}
        </div>

        <form ref={formRef} className="card form" onSubmit={onSubmit} noValidate data-reveal>
          <div className="form__row">
            <div className="field">
              <label htmlFor="contact-name">Nombre</label>
              <input type="text" autoComplete="name" maxLength={LIMITS.name.max} required {...fieldProps('name')} />
              {fieldError('name')}
            </div>
            <div className="field">
              <label htmlFor="contact-email">Correo</label>
              <input type="email" autoComplete="email" maxLength={LIMITS.email.max} required {...fieldProps('email')} />
              {fieldError('email')}
            </div>
          </div>

          <div className="field">
            <label htmlFor="contact-subject">
              Asunto <span className="field__optional">(opcional)</span>
            </label>
            <input type="text" maxLength={LIMITS.subject.max} {...fieldProps('subject')} />
            {fieldError('subject')}
          </div>

          <div className="field">
            <label htmlFor="contact-message">Mensaje</label>
            <textarea rows={6} maxLength={LIMITS.message.max} required {...fieldProps('message')} />
            <div className="field__meta">
              {fieldError('message')}
              <span className="field__count" aria-hidden="true">
                {values.message.length}/{LIMITS.message.max}
              </span>
            </div>
          </div>

          {/* Honeypot: oculto para personas y lectores de pantalla. */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="contact-website">No rellenes este campo</label>
            <input
              id="contact-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={update}
            />
          </div>

          <button type="submit" className="btn btn--primary form__submit" disabled={status === 'sending'}>
            {status === 'sending' ? (
              <>
                <span className="spinner" aria-hidden="true" /> Enviando…
              </>
            ) : (
              <>
                Enviar mensaje <Icon name="arrow" size={18} />
              </>
            )}
          </button>

          <p className={`form__status form__status--${status}`} role="status" aria-live="polite">
            {status !== 'idle' && feedback}
          </p>
        </form>
      </div>
    </section>
  );
}
