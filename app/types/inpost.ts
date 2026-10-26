/** The part of the Geowidget `PointInterface` the storefront relies on. */
export interface InpostPoint {
  name: string
  address?: {
    line1?: string
    line2?: string
  }
  address_details?: {
    street?: string
    building_number?: string
    city?: string
    post_code?: string
  }
}

export interface InpostGeowidgetInitDetail {
  api: {
    addPointSelectedCallback: (callback: (point: InpostPoint) => void) => void
  }
}
