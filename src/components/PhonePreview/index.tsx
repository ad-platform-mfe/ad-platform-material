import React from 'react'
import type { FC } from 'react'
import iphone from '@/assets/images/iphone.png'
import styles from './index.module.less'
import { type Material } from '@/api/material'

interface PhonePreviewProps {
  material: Material | null
  onClose: () => void
}

const PhonePreview: FC<PhonePreviewProps> = ({ material, onClose }) => {
  if (!material) {
    return null
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.phoneContainer}>
        <img src={iphone} alt="Phone Mockup" className={styles.phoneMockup} />
        <div className={styles.screen}>
          {material.type === 'image' ? (
            <img
              src={material.data}
              alt={material.title}
              className={styles.content}
            />
          ) : (
            <video
              src={material.data}
              autoPlay
              controls
              muted
              className={styles.content}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default PhonePreview
