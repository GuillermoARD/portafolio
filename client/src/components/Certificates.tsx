import { useEffect, useRef, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { assetUrl, formatMonth, getCertificates } from '../lib/api';
import type { Certificate } from '../types';
import { Icon } from './Icon';
import { SectionHeading } from './SectionHeading';

export function Certificates() {
  const state = useApi(getCertificates, (r) => r.certificates);
  const [open, setOpen] = useState<Certificate | null>(null);

  return (
    <section id="diplomas" className="section section--alt" aria-labelledby="diplomas-title">
      <div className="container">
        <SectionHeading
          id="diplomas-title"
          eyebrow="04"
          title="Diplomas y certificaciones"
          subtitle="Formación que respalda mi trabajo. Pulsa en un diploma para verlo completo."
        />

        {state.status === 'loading' && (
          <div className="certificates" aria-busy="true" aria-label="Cargando diplomas">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="card skeleton" style={{ height: 240 }} />
            ))}
          </div>
        )}

        {state.status === 'error' && <p className="load-error">No se pudieron cargar los diplomas. {state.error}</p>}

        {state.status === 'ready' && state.data.length === 0 && (
          <p className="load-error">Pronto habrá diplomas por aquí.</p>
        )}

        {state.status === 'ready' && state.data.length > 0 && (
          <ul className="certificates">
            {state.data.map((cert, i) => (
              <li key={cert.id} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                <article className="card certificate">
                  <button type="button" className="certificate__thumb" onClick={() => setOpen(cert)}>
                    <img src={assetUrl(cert.imageUrl) ?? ''} alt="" loading="lazy" width={640} height={452} />
                    <span className="certificate__zoom" aria-hidden="true">
                      Ver diploma
                    </span>
                    <span className="sr-only">Ver el diploma {cert.title} en grande</span>
                  </button>
                  <div className="certificate__body">
                    <h3 className="certificate__title">{cert.title}</h3>
                    <p className="certificate__meta">
                      {cert.issuer}
                      {cert.issuedAt && <> · {formatMonth(cert.issuedAt)}</>}
                    </p>
                    {cert.credentialUrl && (
                      <a className="certificate__verify" href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                        <Icon name="external" size={16} /> Verificar
                        <span className="sr-only"> {cert.title} (se abre en una pestaña nueva)</span>
                      </a>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>

      {open && <CertificateViewer certificate={open} onClose={() => setOpen(null)} />}
    </section>
  );
}

// Visor a pantalla completa con <dialog>: cierra con Esc, con la X o pulsando fuera.
// El cierre lo controla React (no el evento "close"), y al desmontarse se cierra el diálogo.
function CertificateViewer({ certificate, onClose }: { certificate: Certificate; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      if (dialog?.open) dialog.close();
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className="viewer"
      aria-labelledby="viewer-title"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="viewer__inner">
        <div className="viewer__head">
          <div>
            <h2 id="viewer-title">{certificate.title}</h2>
            <p>
              {certificate.issuer}
              {certificate.issuedAt && <> · {formatMonth(certificate.issuedAt)}</>}
            </p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>
        <img className="viewer__img" src={assetUrl(certificate.imageUrl) ?? ''} alt={`Diploma: ${certificate.title}`} />
        {certificate.credentialUrl && (
          <a className="btn btn--ghost btn--sm viewer__verify" href={certificate.credentialUrl} target="_blank" rel="noopener noreferrer">
            Verificar en {certificate.issuer} <Icon name="external" size={16} />
          </a>
        )}
      </div>
    </dialog>
  );
}
