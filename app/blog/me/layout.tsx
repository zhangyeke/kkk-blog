/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-22 20:36:37
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-27 12:15:18
 * @FilePath: \blog\app\blog\me\layout.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
export default async function Layout({children}: Slots<'children'>) {

    return (
        <div className={'flex-1 flex-center bg-center bg-cover bg-fixed random-bg-img dark:bg-none'}>
            {children}
        </div>
    )
}
