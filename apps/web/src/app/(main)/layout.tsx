// import { onAuthenticatedUser } from "@/actions/auth"
// import Navbar from "@/components/global/navbar/Navbar"
// import { Metadata } from "next"

type Props = {
  children: React.ReactNode
}

// export const metadata: Metadata = {
//   title: "Authentication",
//   description: "Sign in or create an account on 0Unveiled.",
//   // robots: "noindex, nofollow",
//   alternates: {
//     canonical: "/login",
//   },
// }
const MainLayout = async ({ children }: Props) => {
  // const user = await onAuthenticatedUser()

  // if (user.status === 200) redirect("/callback/login")

  return (
    <div>
              {/* <Navbar /> */}
            {children}
    </div>
  )
}

export default MainLayout
