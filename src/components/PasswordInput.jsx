import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export default function PasswordInput({ leftIcon: Icon, ...props }) {
  const [show, setShow] = useState(false)
  return (
    <div className="input-wrap">
      {Icon && <Icon className="input-icon" />}
      <input type={show ? 'text' : 'password'} {...props} className="input auth-input" />
      <button type="button" className="input-eye" onClick={() => setShow(!show)}>
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}