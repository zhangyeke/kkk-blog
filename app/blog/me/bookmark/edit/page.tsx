/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 21:53:48
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-05-01 01:12:21
 * @FilePath: \blog\app\blog\me\footprints\edit\page.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Section } from "@/components/k-view";
import EditBookMarkForm from "../../components/EditBookMarkForm";

export const metadata = {
  title: "添加书签"
}

export default async function Page() {
  return (
    <div className="header-padding pb-4 w-full lg:w-1/2">
      <div className={'mt-4 bg-card/80 rounded-sm border border-solid border-input w-full  shadow-md'}>
        <Section>添加书签</Section>

        <div className={'py-4 px-6 '}>
          <EditBookMarkForm />
        </div>
      </div>
    </div>
  )
}