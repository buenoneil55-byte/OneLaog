import React from 'react'
import { Check, Truck, Package } from 'lucide-react'

const steps = [
  { key: 'Pending', label: 'Pending', icon: Package },
  { key: 'Preparing', label: 'Preparing', icon: Check },
  { key: 'Delivering', label: 'Delivering', icon: Truck },
  { key: 'Done', label: 'Done', icon: Check },
]

export default function OrderStatusTracker({ status }) {
  const idx = steps.findIndex((s) => s.key === status)
  return (
    <div className="status-tracker">
      {steps.map((s, i) => (
        <React.Fragment key={s.key}>
          <div className={`step ${i <= idx ? 'active' : ''}`}>
            <div className="step-icon"><s.icon size={14} /></div>
            <span>{s.label}</span>
          </div>
          {i < steps.length - 1 && <div className={`step-line ${i < idx ? 'active' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  )
}