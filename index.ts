'use client'

import { HeatMap } from '@/utils/HeatMap'
import React, { MutableRefObject, useLayoutEffect, useRef, useState } from 'react'
import { Styles as S } from './styles'
import { isMobile } from 'react-device-detect'
import { TraceProps } from '@/interfaces'

export function HeatMapComponent (): React.JSX.Element {
  const [height, setHeight] = useState<number>()
  const ref = useRef() as MutableRefObject<HTMLCanvasElement>

  useLayoutEffect(() => {
    HeatMap.instance().loadTraces()
      .then(() => {
        getGroupedTraces()
      })
    setHeight(document.documentElement.offsetHeight)
  }, [])

  const getGroupedTraces = (): void => {
    const pageTraces = HeatMap.instance().traces[window.location.pathname]

    const groupedTraces = pageTraces?.reduce((result: TraceProps[], value: TraceProps) => {
      const range = 10
      const found = result.find(item => {
        const xDiff = item.x - value.x
        const yDiff = item.y - value.y
        return Math.abs(xDiff) < range && Math.abs(yDiff) < range
      })
      if (found) {
        found.quantity = found.quantity ? found.quantity + 1 : 1
      } else {
        result.push({ ...value, quantity: 1 })
      }

      return result
    }, [])

    const getCssByQuantity = (quantity: number): {
      width: number
      height: number
      backgroundColor: string
    } => {
      const low = {
        backgroundColor: 'rgb(56 93 229 / 10%)',
        height: 10,
        width: 10
      }
      const moderate = {
        backgroundColor: 'rgb(42 71 177 / 15%)',
        height: 12,
        width: 12
      }
      const advanced = {
        backgroundColor: 'rgb(255 165 0 / 20%)',
        height: 14,
        width: 14
      }
      const high = {
        backgroundColor: 'rgb(255 0 0 / 20%)',
        height: 16,
        width: 16
      }

      if (quantity < 3) {
        return low
      }
      if (quantity >= 3 && quantity < 6) {
        return moderate
      }
      if (quantity >= 6 && quantity < 9) {
        return advanced
      }
      if (quantity > 12) {
        return high
      }
      return high
    }

    ref.current.width = document.documentElement.offsetWidth
    ref.current.height = document.documentElement.offsetHeight

    if (!groupedTraces?.length) {
      return
    }

    for (const trace of groupedTraces) {
      const xViewPortProportion = document.documentElement.clientWidth / trace.clientWidth
      const yViewPortProportion = document.documentElement.clientHeight / trace.clientHeight

      const xViewPortAdjustment = trace.x * xViewPortProportion
      const yViewPortAdjustment = trace.y * yViewPortProportion
      const xFinal = xViewPortAdjustment
      const yFinal = yViewPortAdjustment

      const ctx = ref.current.getContext('2d')
      if (ctx && trace.quantity) {
        ctx.beginPath()
        ctx.arc(xFinal, yFinal, getCssByQuantity(trace.quantity).width, 0, Math.PI * 2, false)
        ctx.fillStyle = getCssByQuantity(trace.quantity).backgroundColor
        ctx.fill()
      }
    }
  }

  return (
    <>
      {
        !isMobile && <S.Container style={{ height }} ref={ref} />
      }
    </>
  )
}
