"use client"

import { NotFoundActions } from "./not-found-actions"
import { NotFoundHeader } from "./not-found-header"
import { NotFoundSupport } from "./not-found-support"

export function NotFoundContent() {
  return (
    <>
      <NotFoundHeader />
      <NotFoundActions />
      <NotFoundSupport />
    </>
  )
}
