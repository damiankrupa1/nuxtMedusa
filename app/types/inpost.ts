import type { InpostPoint } from '~/utils/inpost'

export interface InpostGeowidgetInitDetail {
  api: {
    addPointSelectedCallback: (callback: (point: InpostPoint) => void) => void
  }
}
