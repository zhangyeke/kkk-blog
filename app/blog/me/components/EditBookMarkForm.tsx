/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-29 19:43:03
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-29 19:59:31
 * @FilePath: \blog\app\blog\me\components\EditBookMarkForm.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
"use client"
import { toast } from "sonner";
import { createBookmark } from "@/service/bookmark"
import { addBookmarkSchema, } from "@/validators/bookmark";
import { FooterButtons, Form } from "@/components/k-view";
import { useCustomFormSubmit } from "@/hooks/useAutoFormSubmit";
import { Button } from "@/components/ui/button";


export default function EditBookMarkForm() {
  const { formInstance, onSubmit } = useCustomFormSubmit(createBookmark, {
    isResetForm: true,
    submitSuccessAction: (res) => {
      toast.success(res.message || '提交成功')
    }
  })

  return (

    <Form
      ref={formInstance}
      schema={addBookmarkSchema}
      withSubmit={false}
    >
      <FooterButtons >
        <Button type='button' onClick={() => onSubmit()}>提交</Button>
      </FooterButtons>
    </Form>

  )
}
