import type { RcFile } from 'antd/es/upload'

export const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })

export const generateVideoThumbnail = (file: RcFile): Promise<string> => {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.src = URL.createObjectURL(file)
    video.currentTime = 1 

    video.onloadeddata = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
        const thumbnailUrl = canvas.toDataURL('image/jpeg')
        URL.revokeObjectURL(video.src)
        resolve(thumbnailUrl)
      } else {
        URL.revokeObjectURL(video.src)
        resolve('')
      }
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      resolve('')
    }
  })
}

export const getFileType = (file: RcFile): 'image' | 'video' => {
  if (file.type && file.type.startsWith('image/')) {
    return 'image'
  }
  if (file.type && file.type.startsWith('video/')) {
    return 'video'
  }

  const extension = file.name.split('.').pop()?.toLowerCase()
  if (extension === 'mp4' || extension === 'webm' || extension === 'ogg') {
    return 'video'
  }
  return 'image'
}
