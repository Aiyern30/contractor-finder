export function getProfilePath(userType: string): string {
  switch (userType) {
    case "contractor":
      return "/dashboard/contractor/profile";
    case "customer":
      return "/dashboard/customer/profile";
    case "admin":
      return "/dashboard/admin/profile";
    default:
      return "/dashboard";
  }
}

export function getDashboardPath(userType: string): string {
  switch (userType) {
    case "contractor":
      return "/dashboard/contractor";
    case "customer":
      return "/dashboard/customer";
    case "admin":
      return "/dashboard/admin";
    default:
      return "/dashboard";
  }
}
