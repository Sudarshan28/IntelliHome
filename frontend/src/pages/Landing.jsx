import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Zap, Cpu, ArrowRight, Activity, Smartphone } from 'lucide-react';
import ParticleBackground from '../components/ParticleBackground';
import { useRef } from 'react';

const FeatureCard = ({ icon: Icon, title, desc, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay }}
      whileHover={{ scale: 1.05, rotateX: 5, rotateY: 5 }}
      style={{ perspective: 1000 }}
      className="glass p-8 rounded-3xl border border-white/5 bg-gradient-to-br from-dark-800/80 to-dark-900/80 flex flex-col items-center text-center hover:border-brand-500/30 transition-all cursor-pointer group"
    >
      <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.3)]">
        <Icon className="text-brand-400" size={32} />
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{desc}</p>
    </motion.div>
  );
};

export default function Landing() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  });

  const y1 = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <div ref={containerRef} className="relative min-h-[200vh] bg-[#09090b] text-white overflow-hidden">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-50 backdrop-blur-md bg-dark-900/50 border-b border-white/5">
        <h1 className="text-2xl font-bold tracking-tight">Intelli<span className="text-brand-400">Home</span></h1>
        <div className="space-x-4 flex items-center">
          <Link to="/login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors">Log in</Link>
          <Link to="/register" className="bg-white text-black hover:bg-gray-200 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative h-screen flex items-center justify-center pt-20">
        <ParticleBackground />
        
        {/* Cinematic Blur Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-600/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[150px] pointer-events-none" />

        <motion.main 
          style={{ y: y1, opacity, scale }}
          className="z-10 text-center max-w-5xl px-4 flex flex-col items-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-sm font-medium text-gray-300">IntelliHome OS 2.0 is live</span>
          </motion.div>

          <h2 className="text-6xl md:text-8xl font-extrabold mb-8 tracking-tighter leading-tight">
            The intelligent <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500">
              operating system
            </span><br/>
            for your home.
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto font-light leading-relaxed">
            Experience the luxury of invisible computing. Our dynamic FSM engine anticipates your needs, secures your space, and conserves energy—all in real-time.
          </p>

          <Link to="/register">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group bg-brand-500 text-white px-8 py-4 rounded-full text-lg font-bold shadow-[0_0_30px_rgba(20,184,166,0.3)] hover:shadow-[0_0_40px_rgba(20,184,166,0.5)] transition-all flex items-center gap-3"
            >
              Start Free Trial
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </Link>
        </motion.main>
      </div>

      {/* Feature Section with Parallax */}
      <motion.div 
        style={{ y: y2 }}
        className="relative z-20 bg-[#09090b] pt-32 pb-40 px-6 border-t border-white/5"
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">Uncompromising Intelligence.</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">Built from the ground up to be the most advanced, responsive, and secure smart home platform ever created.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Zap} 
              title="Dynamic IFTTT Engine" 
              desc="Forget static rules. Build complex, multi-conditional logic trees that execute in milliseconds when sensor data changes."
              delay={0}
            />
            <FeatureCard 
              icon={Shield} 
              title="Military-grade Security" 
              desc="Automatic AWAY mode triggers instant alerts, fires WebSockets, and dispatches native browser push notifications."
              delay={0.2}
            />
            <FeatureCard 
              icon={Activity} 
              title="Predictive Analytics" 
              desc="We aggregate your live energy consumption and automation history to provide actionable insights via rich, interactive charts."
              delay={0.4}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
