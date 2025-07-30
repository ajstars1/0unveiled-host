// import { Badge } from '../../../../../../components/ui/badge';

import { Badge } from "@/components/ui/badge"

interface ApplicationStatusBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED"
}

export function ApplicationStatusBadge({
  status,
}: ApplicationStatusBadgeProps) {
  const variants = {
    PENDING: {
      variant: "secondary" as const,
      label: "Pending",
    },
    APPROVED: {
      variant: "default" as const,
      label: "Approved",
    },
    REJECTED: {
      variant: "destructive" as const,
      label: "Rejected",
    },
  }

  const { variant, label } = variants[status]

  return (
    <Badge variant={variant} className="ml-2">
      {label}
    </Badge>
  )
}
