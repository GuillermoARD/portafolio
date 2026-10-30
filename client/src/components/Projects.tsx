import { useApi } from '../hooks/useApi';
import { assetUrl, getProjects } from '../lib/api';
import { Icon } from './Icon';
import { SectionHeading } from './SectionHeading';

export function Projects() {
  const state = useApi(getProjects, (r) => r.projects);

  return (
    <section id="proyectos" className="section" aria-labelledby="proyectos-title">
      <div className="container">
        <SectionHeading
          id="proyectos-title"
          eyebrow="03"
          title="Proyectos"
          subtitle="Una selección de trabajos recientes."
        />

        {state.status === 'loading' && (
          <div className="projects" aria-busy="true" aria-label="Cargando proyectos">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="card skeleton" style={{ height: 260 }} />
            ))}
          </div>
        )}

        {state.status === 'error' && <p className="load-error">No se pudieron cargar los proyectos. {state.error}</p>}

        {state.status === 'ready' && state.data.length === 0 && (
          <p className="load-error">Pronto habrá proyectos por aquí.</p>
        )}

        {state.status === 'ready' && state.data.length > 0 && (
          <ul className="projects">
            {state.data.map((project, i) => {
              const image = assetUrl(project.imageUrl);
              return (
                <li key={project.id} data-reveal style={{ transitionDelay: `${i * 70}ms` }}>
                  <article className="card project">
                    {image && (
                      <img className="project__image" src={image} alt="" loading="lazy" width={640} height={360} />
                    )}
                    <div className="project__body">
                      <h3 className="project__title">{project.title}</h3>
                      <p className="project__desc">{project.description}</p>
                      {project.tags.length > 0 && (
                        <ul className="chips chips--small" aria-label="Tecnologías">
                          {project.tags.map((tag) => (
                            <li key={tag} className="chip">
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="project__links">
                        {project.repoUrl && (
                          <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                            <Icon name="github" size={18} /> Código
                            <span className="sr-only"> de {project.title} (se abre en una pestaña nueva)</span>
                          </a>
                        )}
                        {project.demoUrl && (
                          <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                            <Icon name="external" size={18} /> Demo
                            <span className="sr-only"> de {project.title} (se abre en una pestaña nueva)</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
