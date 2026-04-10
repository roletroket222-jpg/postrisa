"use server";

import type { FormActionState } from "@/server/form-state";

import {
  archiveEmployeeAction as archiveEmployeeActionInternal,
  createEmployeeAction as createEmployeeActionInternal,
  importEmployeesAction as importEmployeesActionInternal,
  restoreEmployeeAction as restoreEmployeeActionInternal,
  updateEmployeeAction as updateEmployeeActionInternal,
} from "@/server/master-data/employees";

export async function createEmployeeAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return createEmployeeActionInternal(prevState, formData);
}

export async function updateEmployeeAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return updateEmployeeActionInternal(prevState, formData);
}

export async function importEmployeesAction(
  prevState: FormActionState,
  formData: FormData,
) {
  return importEmployeesActionInternal(prevState, formData);
}

export async function archiveEmployeeAction(formData: FormData) {
  return archiveEmployeeActionInternal(formData);
}

export async function restoreEmployeeAction(formData: FormData) {
  return restoreEmployeeActionInternal(formData);
}
