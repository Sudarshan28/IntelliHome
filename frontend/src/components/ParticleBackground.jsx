import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ParticleBackground() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const particleCount = 30;
    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 10,
      delay: Math.random() * 5
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-brand-400/20 shadow-[0_0_8px_rgba(20,184,166,0.5)]"
          initial={{ x: `${p.x}vw`, y: `${p.y}vh`, opacity: 0 }}
          animate={{
            y: [`${p.y}vh`, `${p.y - 20}vh`, `${p.y}vh`],
            x: [`${p.x}vw`, `${p.x + 10}vw`, `${p.x}vw`],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "linear"
          }}
          style={{ width: p.size, height: p.size }}
        />
      ))}
    </div>
  );
}
