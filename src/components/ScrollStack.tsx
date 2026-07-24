import { useEffect, useRef } from 'react'
import './ScrollStack.css'

export type StackItem = {
  name: string
  desc: string
}

type ScrollStackProps = {
  items: StackItem[]
}

const ScrollStack = ({ items }: ScrollStackProps) => {
  const stackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const stack = stackRef.current
    if (!stack) return

    const onScroll = () => {
      const stickyBase = 96
      const offsetStep = 14

      cardRefs.current.forEach((card, index) => {
        if (!card) return

        let stackedAbove = 0
        for (let j = index + 1; j < cardRefs.current.length; j++) {
          const other = cardRefs.current[j]
          if (!other) continue
          const otherRect = other.getBoundingClientRect()
          const otherSticky = stickyBase + j * offsetStep
          if (otherRect.top <= otherSticky + 4) {
            stackedAbove++
          }
        }

        const scale = stackedAbove > 0 ? Math.max(0.9, 1 - stackedAbove * 0.035) : 1
        const opacity = stackedAbove > 0 ? Math.max(0.55, 1 - stackedAbove * 0.1) : 1

        card.style.transform = `scale(${scale})`
        card.style.opacity = String(opacity)
      })
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [items.length])

  return (
    <div className="scroll-stack" ref={stackRef}>
      <div className="scroll-stack-track">
        {items.map((item, index) => (
          <div
            key={item.name}
            ref={(el) => { cardRefs.current[index] = el }}
            className="scroll-stack-card"
            style={{
              zIndex: index + 1,
              top: `calc(var(--stack-base) + ${index * 14}px)`,
            }}
          >
            <span className="stack-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="stack-content">
              <h3>{item.name}</h3>
              <p>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="scroll-stack-end" aria-hidden="true" />
    </div>
  )
}

export default ScrollStack
