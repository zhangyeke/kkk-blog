"use client"
/*
 * @Author: kkk 997610780@qq.com
 * @Date: 2026-04-25 20:56:25
 * @LastEditors: kkk 997610780@qq.com
 * @LastEditTime: 2026-04-25 21:32:53
 * @FilePath: \blog\components\Permission\index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React from "react"
export type PermissionProps = {
  children: React.ReactNode
  permission?: string
  roles:string
}

const whitePermissionList = ["superAdmin", "admin",]

export function Permission({ children, permission = 'user' }: PermissionProps) {
  if (!whitePermissionList.includes(permission)) {
    return null
  }
  return (
    <>
      {children}
    </>
  )
}