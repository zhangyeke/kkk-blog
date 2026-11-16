import { clusterByGrid, type ClusterPoint, clusterPolicy } from "./cluster"

const p = (id: string, x: number, y: number): ClusterPoint<string> => ({id, x, y, data: id})

describe("clusterByGrid", () => {
    test("同一格子内的点合并，中心取均值", () => {
        const result = clusterByGrid([p("a", 10, 10), p("b", 30, 30)], 64)
        expect(result).toHaveLength(1)
        expect(result[0]!.items.map((i) => i.id)).toEqual(["a", "b"])
        expect(result[0]!.x).toBe(20)
        expect(result[0]!.y).toBe(20)
        expect(result[0]!.key).toBe("c:0:0")
    })

    test("跨格子的点保持独立，单点簇用自身 id 作 key", () => {
        const result = clusterByGrid([p("a", 10, 10), p("b", 200, 200)], 64)
        expect(result).toHaveLength(2)
        const keys = result.map((r) => r.key).sort()
        expect(keys).toEqual(["a", "b"])
    })

    test("格子边界按左闭右开划分", () => {
        // 63 与 64 属于不同格子
        const result = clusterByGrid([p("a", 63, 10), p("b", 64, 10)], 64)
        expect(result).toHaveLength(2)
    })

    test("空输入返回空数组", () => {
        expect(clusterByGrid([], 64)).toEqual([])
    })

    test("结果为稳定排序（先 y 后 x）", () => {
        const result = clusterByGrid([p("c", 10, 200), p("a", 10, 10), p("b", 200, 10)], 64)
        expect(result.map((r) => r.items[0]!.id)).toEqual(["a", "b", "c"])
    })

    test("cellSize 非法值不会崩（下限夹到 1）", () => {
        // cellSize=0 被夹到 1，两个点相距 1 会落在相邻格子 → 仍是两个簇
        expect(() => clusterByGrid([p("a", 1, 1), p("b", 2, 2)], 0)).not.toThrow()
        expect(clusterByGrid([p("a", 1, 1), p("b", 2, 2)], 0)).toHaveLength(2)
        // 负值同理
        expect(clusterByGrid([p("a", 1, 1)], -10)).toHaveLength(1)
    })

    test("所有点落在一格时只产生一个簇", () => {
        const points = Array.from({length: 50}, (_, i) => p(`p${i}`, 10 + i, 10 + i))
        const result = clusterByGrid(points, 200)
        expect(result).toHaveLength(1)
        expect(result[0]!.items).toHaveLength(50)
    })
})

describe("clusterPolicy", () => {
    test("低缩放全聚合、高缩放展开", () => {
        expect(clusterPolicy(3)).toEqual({enabled: true, cellSize: 72})
        expect(clusterPolicy(7)).toEqual({enabled: true, cellSize: 56})
        expect(clusterPolicy(12)).toEqual({enabled: false, cellSize: 48})
    })

    test("临界值 6 与 9 的归属", () => {
        expect(clusterPolicy(5.9).cellSize).toBe(72)
        expect(clusterPolicy(6).cellSize).toBe(56)
        expect(clusterPolicy(8.9).enabled).toBe(true)
        expect(clusterPolicy(9).enabled).toBe(false)
    })
})
