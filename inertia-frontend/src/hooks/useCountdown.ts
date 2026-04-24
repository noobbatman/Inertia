import { useEffect, useRef, useState } from 'react'

export function useCountdown(seconds: number, onExpire: () => void) {
  const [remaining, setRemaining] = useState(seconds)
  const onExpireRef = useRef(onExpire)

  useEffect(() => {
    onExpireRef.current = onExpire
  }, [onExpire])

  useEffect(() => {
    setRemaining(seconds)
  }, [seconds])

  useEffect(() => {
    if (remaining <= 0) {
      // Only fire onExpire if we actually counted down to zero, not on
      // initial mount with seconds=0 or when the timer is externally cleared.
      if (seconds > 0) {
        onExpireRef.current()
      }
      return
    }

    const intervalId = window.setInterval(() => {
      setRemaining((value) => Math.max(0, value - 1))
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [remaining, seconds])

  return remaining
}
