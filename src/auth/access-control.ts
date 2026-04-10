export const LOGIN_PATH = "/login";
export const DASHBOARD_ROOT_PATH = "/dashboard";
export const ADMIN_HOME_PATH = "/dashboard/admin";
export const EMPLOYEE_HOME_PATH = "/dashboard/karyawan";

export type AppRole = "ADMIN" | "KARYAWAN";
export type AppDivision = "TABUNG" | "ASESORIS" | "PACKING";

export function resolveHomeByRole(role: AppRole) {
  return role === "ADMIN" ? ADMIN_HOME_PATH : EMPLOYEE_HOME_PATH;
}

export function isLoginPath(pathname: string) {
  return pathname === LOGIN_PATH;
}

export function isDashboardPath(pathname: string) {
  return pathname === DASHBOARD_ROOT_PATH || pathname.startsWith(`${DASHBOARD_ROOT_PATH}/`);
}

export function isAdminPath(pathname: string) {
  return pathname === ADMIN_HOME_PATH || pathname.startsWith(`${ADMIN_HOME_PATH}/`);
}

export function isEmployeePath(pathname: string) {
  return pathname === EMPLOYEE_HOME_PATH || pathname.startsWith(`${EMPLOYEE_HOME_PATH}/`);
}
