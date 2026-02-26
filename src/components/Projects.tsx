import { motion } from 'motion/react';
import { ExternalLink, Github } from 'lucide-react';

const projects = [
  {
    title: "Lumina AI",
    category: "AI Platform",
    image: "https://picsum.photos/seed/lumina/800/600",
    description: "A generative design tool that helps architects visualize spaces using neural networks.",
    tags: ["React", "Three.js", "Gemini"]
  },
  {
    title: "Aether OS",
    category: "UI/UX Design",
    image: "https://picsum.photos/seed/aether/800/600",
    description: "Conceptual operating system focused on spatial computing and minimal interaction.",
    tags: ["Framer", "SwiftUI", "Design"]
  },
  {
    title: "Nexus Finance",
    category: "Fintech",
    image: "https://picsum.photos/seed/nexus/800/600",
    description: "Real-time crypto analytics dashboard with predictive market sentiment analysis.",
    tags: ["Next.js", "D3.js", "WebSockets"]
  }
];

export default function Projects() {
  return (
    <section id="projects" className="py-32 bg-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-8">
          <div>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
              SELECTED <br /> WORKS
            </h2>
            <p className="text-white/50 max-w-md font-light">
              A collection of projects that push the boundaries of what's possible on the web.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="px-6 py-2 border border-white/10 rounded-full text-sm text-white/60">
              2023 — 2025
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, i) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative"
            >
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-white/5 border border-white/10 mb-6">
                <img 
                  src={project.image} 
                  alt={project.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <button className="p-4 bg-white text-black rounded-full hover:scale-110 transition-transform">
                    <ExternalLink className="w-5 h-5" />
                  </button>
                  <button className="p-4 bg-black/50 text-white rounded-full hover:scale-110 transition-transform backdrop-blur-md">
                    <Github className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold tracking-widest uppercase text-white/40 mb-2 block">
                    {project.category}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-3">{project.title}</h3>
                  <p className="text-white/50 text-sm font-light leading-relaxed mb-4">
                    {project.description}
                  </p>
                  <div className="flex gap-2">
                    {project.tags.map(tag => (
                      <span key={tag} className="text-[10px] px-2 py-1 bg-white/5 border border-white/10 rounded text-white/60 uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
