/**
 * 屏幕空间网格聚合。
 *
 * 为什么不用 supercluster：
 * 本项目的点位数量是「地点数」量级（几十个），不是「照片数」量级（上万）。
 * 网格聚合 20 行、零依赖、纯函数可单测，足够；supercluster 是为万级点位设计的。
 *
 * 输入必须是**屏幕坐标**（已按当前 zoom 投影），不是经纬度——
 * 这样聚合结果与缩放级别天然对齐，缩小时自动合并。
 */

export type ClusterPoint<T> = {
    /** 唯一键，用于 React key 与稳定排序 */
    id: string
    /** 屏幕坐标（px） */
    x: number
    y: number
    data: T
}

export type ClusterResult<T> = {
    /** 聚合中心（成员坐标均值） */
    x: number
    y: number
    /** 该簇包含的点，按传入顺序 */
    items: ClusterPoint<T>[]
    /** 簇的唯一键：单点簇用该点 id，多点簇用网格键 */
    key: string
}

/**
 * 按网格聚合。同一 cellSize × cellSize 格子内的点合并为一簇。
 * @param points 屏幕坐标点
 * @param cellSize 格子边长（px），建议 48–72（约等于 pin 尺寸）
 */
export function clusterByGrid<T>(
    points: readonly ClusterPoint<T>[],
    cellSize: number,
): ClusterResult<T>[] {
    if (points.length === 0) return []
    const size = Math.max(cellSize, 1)

    const buckets = new Map<string, ClusterPoint<T>[]>()
    for (const point of points) {
        const cx = Math.floor(point.x / size)
        const cy = Math.floor(point.y / size)
        const key = `${cx}:${cy}`
        const bucket = buckets.get(key)
        if (bucket) bucket.push(point)
        else buckets.set(key, [point])
    }

    const results: ClusterResult<T>[] = []
    for (const [key, items] of buckets) {
        if (items.length === 1) {
            const only = items[0]!
            results.push({x: only.x, y: only.y, items, key: only.id})
            continue
        }
        let sumX = 0
        let sumY = 0
        for (const item of items) {
            sumX += item.x
            sumY += item.y
        }
        results.push({
            x: sumX / items.length,
            y: sumY / items.length,
            items,
            key: `c:${key}`,
        })
    }

    // 稳定排序：先按 y 再按 x，避免每次重渲染顺序抖动
    return results.sort((a, b) => (a.y === b.y ? a.x - b.x : a.y - b.y))
}

/**
 * 缩放级别 → 聚合策略。
 * 低 zoom 全部聚合，高 zoom 才展开成缩略图 pin。
 */
export function clusterPolicy(zoom: number): { enabled: boolean; cellSize: number } {
    if (zoom < 6) return {enabled: true, cellSize: 72}
    if (zoom < 9) return {enabled: true, cellSize: 56}
    return {enabled: false, cellSize: 48}
}
