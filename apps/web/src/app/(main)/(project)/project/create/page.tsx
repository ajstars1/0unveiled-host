// import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
// import { cookies } from "next/headers"
import CreateProject from "./createForm"
import { getUserBySupabaseId } from "@/data/user"
import { createSupabaseServerClient } from "@0unveiled/lib/supabase"

import { redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Suspense } from "react"
import Link from "next/link"

const page = async () => {
  // const supabase = createServerComponentClient({ cookies })
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (!user || authError) {
    redirect("/login")
  }

  const dbUser = await getUserBySupabaseId(user.id)
  if (!dbUser) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto py-8 px-4">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/projects" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Create New Project
            </h1>
            <p className="text-muted-foreground mt-1">
              Bring your ideas to life
            </p>
          </div>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <CreateProject user={dbUser} />
        </Suspense>
      </div>
    </div>
  )
}

export default page
