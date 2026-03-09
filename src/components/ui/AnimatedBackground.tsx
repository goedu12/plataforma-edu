'use client'

import { useEffect, useRef, useMemo } from 'react'

interface Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  type: 'circle' | 'triangle' | 'hexagon' | 'square' | 'atom'
  rotation: number
  rotationSpeed: number
  color: string
}

interface AnimatedBackgroundProps {
  variant?: 'default' | 'fisica' | 'matematica'
  particleCount?: number
  className?: string
}

export default function AnimatedBackground({
  variant = 'default',
  particleCount = 30,
  className = '',
}: AnimatedBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const particlesRef = useRef<Particle[]>([])

  const colors = useMemo(() => {
    switch (variant) {
      case 'fisica':
        return {
          primary: 'rgba(34, 197, 94, 0.6)',    // Verde (--color-fisica)
          secondary: 'rgba(34, 197, 94, 0.4)',
          tertiary: 'rgba(34, 197, 94, 0.2)',
          glow: 'rgba(34, 197, 94, 0.15)',
        }
      case 'matematica':
        return {
          primary: 'rgba(139, 92, 246, 0.6)',   // Roxo (--color-matematica)
          secondary: 'rgba(139, 92, 246, 0.4)',
          tertiary: 'rgba(139, 92, 246, 0.2)',
          glow: 'rgba(139, 92, 246, 0.15)',
        }
      default:
        return {
          primary: 'rgba(255, 107, 44, 0.5)',
          secondary: 'rgba(34, 197, 94, 0.4)',
          tertiary: 'rgba(139, 92, 246, 0.3)',
          glow: 'rgba(255, 107, 44, 0.1)',
        }
    }
  }, [variant])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Inicializar partículas
    const colorArray = [colors.primary, colors.secondary, colors.tertiary]
    const types: Particle['type'][] = ['circle', 'triangle', 'hexagon', 'square', 'atom']

    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 20 + 5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.5 + 0.1,
      type: types[Math.floor(Math.random() * types.length)],
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      color: colorArray[Math.floor(Math.random() * colorArray.length)],
    }))

    const drawParticle = (particle: Particle) => {
      ctx.save()
      ctx.translate(particle.x, particle.y)
      ctx.rotate(particle.rotation)
      ctx.globalAlpha = particle.opacity

      // Glow effect
      ctx.shadowBlur = 20
      ctx.shadowColor = particle.color

      ctx.fillStyle = particle.color
      ctx.strokeStyle = particle.color
      ctx.lineWidth = 1

      switch (particle.type) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, particle.size / 2, 0, Math.PI * 2)
          ctx.fill()
          break

        case 'triangle':
          ctx.beginPath()
          ctx.moveTo(0, -particle.size / 2)
          ctx.lineTo(particle.size / 2, particle.size / 2)
          ctx.lineTo(-particle.size / 2, particle.size / 2)
          ctx.closePath()
          ctx.stroke()
          break

        case 'hexagon':
          ctx.beginPath()
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i
            const x = (particle.size / 2) * Math.cos(angle)
            const y = (particle.size / 2) * Math.sin(angle)
            if (i === 0) ctx.moveTo(x, y)
            else ctx.lineTo(x, y)
          }
          ctx.closePath()
          ctx.stroke()
          break

        case 'square':
          ctx.strokeRect(-particle.size / 4, -particle.size / 4, particle.size / 2, particle.size / 2)
          break

        case 'atom':
          // Núcleo
          ctx.beginPath()
          ctx.arc(0, 0, particle.size / 6, 0, Math.PI * 2)
          ctx.fill()
          // Órbitas
          ctx.globalAlpha = particle.opacity * 0.5
          for (let i = 0; i < 3; i++) {
            ctx.save()
            ctx.rotate((Math.PI / 3) * i)
            ctx.beginPath()
            ctx.ellipse(0, 0, particle.size / 2, particle.size / 4, 0, 0, Math.PI * 2)
            ctx.stroke()
            ctx.restore()
          }
          break
      }

      ctx.restore()
    }

    const drawConnections = () => {
      const particles = particlesRef.current
      ctx.strokeStyle = colors.glow
      ctx.lineWidth = 0.5

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.globalAlpha = (1 - distance / 150) * 0.3
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Gradient de fundo sutil
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      )
      gradient.addColorStop(0, 'rgba(26, 26, 36, 0.3)')
      gradient.addColorStop(1, 'rgba(10, 10, 15, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Desenhar conexões
      drawConnections()

      // Atualizar e desenhar partículas
      particlesRef.current.forEach((particle) => {
        // Movimento
        particle.x += particle.speedX
        particle.y += particle.speedY
        particle.rotation += particle.rotationSpeed

        // Wrap around
        if (particle.x < -50) particle.x = canvas.width + 50
        if (particle.x > canvas.width + 50) particle.x = -50
        if (particle.y < -50) particle.y = canvas.height + 50
        if (particle.y > canvas.height + 50) particle.y = -50

        // Pulsar opacidade
        particle.opacity = 0.2 + Math.sin(Date.now() * 0.001 + particle.x) * 0.15

        drawParticle(particle)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [colors, particleCount])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ background: 'transparent' }}
    />
  )
}

// Componente de grid animado simples (alternativa leve)
export function AnimatedGrid({ className = '' }: { className?: string }) {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`}>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fisica-400/10 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-matematica-300/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-accent-orange/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />

      {/* Floating geometric shapes */}
      <div className="absolute top-20 right-20 w-4 h-4 border border-fisica-400/30 rotate-45 animate-float" />
      <div className="absolute bottom-32 left-32 w-6 h-6 border border-matematica-300/30 rounded-full animate-float-slow" />
      <div className="absolute top-1/3 left-20 w-3 h-3 bg-accent-orange/20 animate-twinkle" />
      <div className="absolute bottom-1/4 right-40 w-5 h-5 border border-fisica-400/20 animate-rotate-slow" style={{ clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)' }} />
    </div>
  )
}
