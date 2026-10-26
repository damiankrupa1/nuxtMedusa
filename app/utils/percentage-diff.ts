export const getPercentageDiff = (
  original?: number | null,
  calculated?: number | null,
) => {
  if (original == null || calculated == null || original === 0) {
    return null
  }
  const diff = original - calculated
  const percentageDiff = (diff / original) * 100

  return percentageDiff.toFixed()
}
