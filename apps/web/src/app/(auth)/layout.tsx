// import { onAuthenticatedUser } from "@/actions/auth"
import BackdropGradient from "@/components/global/backdrop-gradient"
import GlassCard from "@/components/global/glass-card"
import { Metadata } from "next"

type Props = {
  children: React.ReactNode
}

export const metadata: Metadata = {
  title: "Authentication",
  description: "Sign in or create an account on 0Unveiled.",
  // robots: "noindex, nofollow",
  alternates: {
    canonical: "/login",
  },
}
const AuthLayout = async ({ children }: Props) => {
  // const user = await onAuthenticatedUser()

  // if (user.status === 200) redirect("/callback/login")

  return (
  <div>
    {/* // <div className=" h-screen flex justify-center items-center"> */}
    {/* //   <div className="flex flex-col w-full items-center py-24">
    //     <h2 className="text-4xl font-bold text-themeTextWhite">0Unveiled</h2>
    //     <BackdropGradient
    //       className="w-4/12 h-2/6 opacity-40"
    //       container="flex flex-col items-center"
    //     > */}
          {/* <GlassCard className="xs:w-full flex justify-center items-center md:w-7/12 lg:w-5/12 xl:w-4/12 p-7 mt-16"> */}
            {children}
          {/* </GlassCard> */}
    {/* //     </BackdropGradient> */}
      {/* // </div> */}
    </div>
  )
}

export default AuthLayout
