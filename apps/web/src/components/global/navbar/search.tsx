import { Input } from "@/components/ui/input"

export function Search({ className }: React.HTMLAttributes<HTMLElement>) {
  return (
    <div className={className}>
      <Input
        type="search"
        placeholder="Search..."
        className="md:w-[100px] lg:w-[300px]"
      />
    </div>
  )
}
